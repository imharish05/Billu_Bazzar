'use strict';
const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const {Op}=require('sequelize');
const {couponReason,couponDiscount}=require('../../services/couponRules');
let rows,usage,queries,failure;
const id=require.resolve('../../models');
require.cache[id]={id,filename:id,loaded:true,exports:{
 Coupon:{findAll:async options=>{queries.coupons=options;if(failure)throw Error('database failed');return rows;},findOne:async ({where})=>rows.find(row=>row.code===where.code)},
 Order:{findAll:async options=>{queries.usage=options;return usage;},count:async options=>{queries.usage=options;return usage.filter(o=>o.couponId===options.where.couponId).length;}}
}};
const controller=require('./offersController');
const base={id:1,code:'SAVE10',type:'PERCENT',value:'10.00',minOrderValue:'100.00',maxDiscount:'50.00',usageLimit:1,isActive:true,validFrom:'2020-01-01',validUntil:'2099-01-01'};
const call=async(action,{body={},query={}}={})=>{let status=200,data,error;await controller[action]({body,query,customer:{id:7}},{status(code){status=code;return this;},json(value){data=value;}},e=>{error=e;});return {status,data,error};};
beforeEach(()=>{rows=[{...base}];usage=[];queries={};failure=false;});
test('list filters dates and customer limits, then paginates',async()=>{
 rows.push({...base,id:2,code:'OLD',validUntil:'2021-01-01'},{...base,id:3,code:'USED'},{...base,id:4,code:'NEXT',validFrom:'2098-01-01'},{...base,id:5,code:'OTHER'});
 usage=[{couponId:3}];
 const result=await call('getCoupons',{query:{limit:'1',page:'2'}});
 assert.equal(result.data.total,2);assert.equal(result.data.coupons[0].id,5);assert.equal(result.data.hasMore,false);
 assert.equal(queries.usage.where.customerId,7);assert.equal(queries.usage.where.status[Op.ne],'CANCELLED');assert.equal(queries.coupons.where.isActive,true);
 assert.ok(queries.coupons.where.validFrom[Op.lte] instanceof Date);
});
test('subtotal filter and empty result retain predictable pagination',async()=>{
 const filtered=await call('getCoupons',{query:{subtotal:'50'}});assert.equal(filtered.data.total,0);assert.deepEqual(filtered.data.coupons,[]);
 const available=await call('getCoupons',{query:{subtotal:'1000'}});assert.equal(available.data.coupons[0].discountAmount,50);
 assert.equal(available.data.coupons[0].usageCount,undefined);
});
test('validation normalizes code, calculates cap and never uses supplied customer',async()=>{
 const result=await call('validate',{body:{code:' save10 ',subtotal:1000,customerId:99}});
 assert.equal(result.status,200);assert.equal(result.data.discountAmount,50);assert.equal(result.data.discountedSubtotal,950);assert.equal(queries.usage.where.customerId,7);
 usage=[{couponId:1}];assert.equal((await call('validate',{body:{code:'SAVE10',subtotal:1000}})).status,400);
});
test('rejects invalid input and unavailable codes',async()=>{
 for(const subtotal of [-1,null,'100',true,NaN,Infinity,1.234,{}])assert.equal((await call('validate',{body:{code:'SAVE10',subtotal}})).status,400);
 for(const code of [null,{},'', 'x'.repeat(31)])assert.equal((await call('validate',{body:{code,subtotal:100}})).status,400);
 assert.equal((await call('validate',{body:{code:'UNKNOWN',subtotal:100}})).status,404);
 rows[0].validUntil='2020-01-02';assert.equal((await call('validate',{body:{code:'SAVE10',subtotal:100}})).status,400);
 assert.equal((await call('getCoupons',{query:{subtotal:['100']}})).status,400);
});
test('flat discounts are clamped, percentage rounded, shipping separate',async()=>{
 assert.equal(couponDiscount({...base,type:'FLAT',value:500},200),200);
 assert.equal(couponDiscount({...base,value:10,maxDiscount:null},123.45),12.35);
 assert.equal(couponDiscount({...base,value:200,maxDiscount:null},100),100);
 rows[0]={...base,type:'FREE_SHIPPING',value:0,usageLimit:null};
 const result=await call('validate',{body:{code:'SAVE10',subtotal:200}});
 assert.equal(result.data.freeShipping,true);assert.equal(result.data.discountAmount,0);assert.equal(result.data.discountedSubtotal,200);
 assert.equal(couponReason({...base,usageLimit:null},200,99),null);
 assert.equal(couponReason({...base,validFrom:'invalid'},200),'Coupon is unavailable');
});
test('database errors are passed to the generic mobile error handler',async()=>{
 failure=true;const result=await call('getCoupons');assert.ok(result.error);assert.equal(result.data,undefined);
});
