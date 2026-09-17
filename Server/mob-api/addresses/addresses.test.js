'use strict';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const stub = (file, exports) => { const id = require.resolve(file); require.cache[id] = {id, filename:id, loaded:true, exports}; };
let rows, nextId, queue = Promise.resolve(), failCreate;
const matches = (row, where) => Object.entries(where).every(([key,value])=>row[key]===value);
const wrap = row => row && { ...row, toJSON:()=>({...row}), update:async values=>{Object.assign(row,values);return wrap(row);}, reload:async()=>wrap(row), destroy:async()=>{rows=rows.filter(r=>r.id!==row.id);} };
const sorted = options => rows.filter(row=>matches(row,options.where)).sort((a,b)=>options.order?.[0]?.[0]==='isDefault' ? Number(b.isDefault)-Number(a.isDefault)||a.id-b.id : a.id-b.id);
const CustomerAddress = {
 findOne:async options=>wrap(sorted(options)[0]), findAll:async options=>sorted(options).map(wrap),
 count:async ({where})=>rows.filter(row=>matches(row,where)).length,
 create:async values=>{if(failCreate)throw Error('Database failed');const row={id:++nextId,label:'Home',email:'',addressLine2:'',landmark:'',...values};rows.push(row);return wrap(row);},
 update:async (values,{where})=>rows.filter(row=>matches(row,where)).forEach(row=>Object.assign(row,values)),
};
stub('../../models',{ CustomerAddress, Customer:{findByPk:async id=>({id})} });
stub('../../config/db',{transaction:work=>{
 const result=queue.then(async()=>{const snapshot=structuredClone(rows);try{return await work({LOCK:{UPDATE:'UPDATE'}});}catch(e){rows=snapshot;throw e;}});
 queue=result.catch(()=>{});return result;
}});
const c=require('./addressesController');
const input={name:'Test Customer',phone:'+919876543210',address:'10 Test Street',city:'Chennai',state:'Tamil Nadu',pincode:'600001',country:'India'};
const call=async(fn,body={},id='1',customerId=7)=>{
 let status=200,data,error,next=false;
 const req={body,params:{addressId:String(id)},customer:{id:customerId}};
 await fn(req,{status(code){status=code;return this;},json(value){data=JSON.parse(JSON.stringify(value));}},err=>{error=err;next=true;});
 return {status,data,error,next,req};
};
beforeEach(()=>{rows=[];nextId=0;failCreate=false;});
test('first address is default; concurrent creates and updates preserve one default',async()=>{
 await Promise.all([call(c.createAddress,input),call(c.createAddress,{...input,label:'Work',isDefault:true})]);
 assert.equal(rows.filter(r=>r.isDefault).length,1);
 assert.equal(rows[1].isDefault,true);
 await call(c.updateAddress,{isDefault:true},2);
 assert.equal(rows[1].isDefault,true);
 await call(c.setDefaultAddress,{},1);
 await call(c.setDefaultAddress,{},1);
 assert.equal(rows.filter(r=>r.isDefault).length,1);
 assert.equal(rows[0].isDefault,true);
 assert.equal((await call(c.updateAddress,{isDefault:false},1)).status,400);
});
test('customer isolation for reads, updates, defaults, deletes and checkout',async()=>{
 await call(c.createAddress,input);
 for(const fn of [c.getAddress,c.updateAddress,c.setDefaultAddress,c.deleteAddress])assert.equal((await call(fn,{label:'Other'},1,8)).status,404);
 assert.deepEqual((await call(c.listAddresses,{},1,8)).data.addresses,[]);
 const result=await call(c.resolveOrderAddresses,{shippingAddressId:1},1,8);
 assert.equal(result.status,404);assert.equal(result.next,false);
 assert.equal(rows[0].customerId,7);
});
test('rejects malformed inputs and ownership injection without writes',async()=>{
 for(const body of [null,[],{}, {...input,customerId:8},{...input,phone:'--------'},{...input,isDefault:'true'},{...input,address:' '},{...input,email:'invalid'},{...input,name:'x'.repeat(121)}])assert.equal((await call(c.createAddress,body)).status,400);
 assert.equal(rows.length,0);
 assert.equal((await call(c.getAddress,{},'1abc')).status,400);
});
test('deleting default promotes oldest remaining owned address',async()=>{
 await call(c.createAddress,input);await call(c.createAddress,input);await call(c.createAddress,input,1,8);
 await call(c.deleteAddress,{},1);
 assert.equal(rows.find(r=>r.id===2).isDefault,true);assert.equal(rows.find(r=>r.customerId===8).isDefault,true);
 await call(c.deleteAddress,{},2);
 assert.deepEqual((await call(c.listAddresses)).data.addresses,[]);
});
test('transaction failure restores previous default',async()=>{
 await call(c.createAddress,input);failCreate=true;
 const result=await call(c.createAddress,{...input,isDefault:true});
 assert.ok(result.error);assert.equal(rows.length,1);assert.equal(rows[0].isDefault,true);
});
test('checkout copies shipping and billing fields and preserves snapshots after editing',async()=>{
 await call(c.createAddress,input);await call(c.createAddress,{...input,address:'20 Work Street'});
 const result=await call(c.resolveOrderAddresses,{shippingAddressId:1,billingAddressId:2});
 assert.equal(result.next,true);assert.equal(result.req.body.shippingAddress.address,input.address);
 assert.equal(result.req.body.billingAddress.address,'20 Work Street');
 assert.equal(result.req.body.shippingAddress.customerId,undefined);
 await call(c.updateAddress,{address:'30 New Street'},1);await call(c.deleteAddress,{},1);
 assert.equal(result.req.body.shippingAddress.address,input.address);
 for(const body of [{shippingAddressId:'2'},{shippingAddressId:2,shippingAddress:input},{billingAddressId:2,billingAddress:input}])assert.equal((await call(c.resolveOrderAddresses,body)).status,400);
 const inline=await call(c.resolveOrderAddresses,{shippingAddress:input});assert.equal(inline.next,true);assert.deepEqual(inline.req.body.shippingAddress,input);
});
