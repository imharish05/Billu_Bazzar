'use strict';
const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
let create, fetchPayment, refund, received;
const id=require.resolve('razorpay');
require.cache[id]={id,filename:id,loaded:true,exports:class {
 constructor(){this.api={rq:{defaults:{},interceptors:{response:{use(){}}}}};this.orders={create:async options=>{received=options;return create();}};this.payments={fetch:()=>fetchPayment(),refund:()=>refund()};}
}};
const service=require('./RazorpayService');
beforeEach(()=>{process.env.NODE_ENV='development';process.env.RAZORPAY_KEY_ID='rzp_test_validKey';process.env.RAZORPAY_KEY_SECRET='validSecret';create=async()=>({id:'order_real',status:'created'});fetchPayment=async()=>({order_id:'order_real',amount:1250,currency:'INR',status:'captured'});refund=async()=>({id:'rfnd_real',amount:1250,currency:'INR',status:'processed'});});
test('creates a real gateway order in paise',async()=>{
 const result=await service.createOrder({amount:12.5,receipt:'test',currency:'INR'});
 assert.equal(result.gatewayRef,'order_real');assert.equal(received.amount,1250);assert.equal(result.raw.isSimulation,undefined);
});
test('missing credentials fail without simulating success',async()=>{
 delete process.env.RAZORPAY_KEY_SECRET;
 await assert.rejects(service.createOrder({amount:10}),e=>e.status===503&&e.code==='PAYMENT_GATEWAY_NOT_CONFIGURED');
 const result=await service.refund('pay_test',10);assert.equal(result.success,false);
});
test('gateway errors never become fake orders in development',async()=>{
 create=async()=>{throw {statusCode:401,error:{description:'Authentication failed'}};};
 await assert.rejects(service.createOrder({amount:10}),e=>e.status===503&&e.code==='PAYMENT_GATEWAY_AUTH_FAILED');
 create=async()=>{throw {statusCode:500,error:{description:'Network failure'}};};
 await assert.rejects(service.createOrder({amount:10}),e=>e.status===502&&e.code==='PAYMENT_GATEWAY_ERROR');
});
test('failed payment lookup never becomes captured',async()=>{
 fetchPayment=async()=>{throw Error('Network error');};
 await assert.rejects(service.fetchPayment('pay_test'),/Network error/);
 await assert.rejects(service.fetchPayment('order_sim_123'),/Network error/);
});
test('invalid amounts are rejected before requesting gateway',async()=>{
 for(const amount of [0,-1,NaN,Infinity,0.5])await assert.rejects(service.createOrder({amount}),e=>e.status===400);
});
