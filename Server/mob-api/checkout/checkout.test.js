'use strict';
const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const stub=(file,exports)=>{const id=require.resolve(file);require.cache[id]={id,filename:id,loaded:true,exports};};
let submitted,cart,addresses,failure,query;
const saved={id:10,customerId:7,name:'Recipient',phone:'+919876543210',address:'10 Test Street',addressLine2:'Floor 2',landmark:'',city:'Chennai',state:'Tamil Nadu',pincode:'600001',country:'India',email:'',isDefault:true};
stub('../../models',{CustomerAddress:{findAll:async options=>{query=options;if(failure)throw Error('database unavailable');return addresses;},findOne:async({where})=>{const row=addresses.find(a=>a.id===where.id&&a.customerId===where.customerId);return row?{toJSON:()=>({...row})}:null;}}});
stub('../cart/cartController',{getCartData:async()=>({cart})});
stub('../../controllers/authController',{});
stub('../../controllers/orderController',{placeOrder:async(req,res)=>{submitted=req.body;return res.status(201).json({success:true,order:{id:1}});}});
stub('../payments/paymentsController',{initiatePayment:()=>{},verifyPayment:()=>{}});
const controller=require('./checkoutController');
const call=async(action,body={},customerId=7)=>{let status=200,data,error;await controller[action]({body,customer:{id:customerId,email:'customer@example.com'}},{status(value){status=value;return this;},json(value){data=value;}},e=>{error=e;});return {status,data,error};};
beforeEach(()=>{submitted=null;failure=false;addresses=[{...saved}];cart={items:[],subtotal:0};});
test('checkout returns owned addresses, cart stock flags and non-final total marker',async()=>{
 cart.items=[{id:4,productId:3,variantId:null,stockStatus:'OUT_OF_STOCK',availableStock:0}];
 const result=await call('getCheckout');assert.equal(result.status,200);assert.equal(query.where.customerId,7);
 assert.equal(result.data.checkout.defaultAddressId,10);assert.equal(result.data.checkout.totalsAreFinal,false);assert.equal(result.data.checkout.stockIssues.length,1);
 addresses=[];assert.equal((await call('getCheckout')).data.checkout.defaultAddressId,null);
});
test('saved addresses are resolved before placing order and snapshotted',async()=>{
 const result=await call('placeOrder',{shippingAddressId:10,paymentMethod:'Razorpay Secure Online',requestedCurrency:'INR'});
 assert.equal(result.status,201);assert.equal(submitted.shippingAddress.flatHouse,'10 Test Street, Floor 2');assert.equal(submitted.shippingAddress.email,'customer@example.com');
 addresses[0].address='Changed';assert.equal(submitted.shippingAddress.address,'10 Test Street');
});
test('rejects another customer address without creating an order',async()=>{
 const result=await call('placeOrder',{shippingAddressId:10,paymentMethod:'COD'},8);assert.equal(result.status,404);assert.equal(submitted,null);
});
test('invalid checkout requests cannot reach shared order placement',async()=>{
 for(const body of [{},{paymentMethod:'unknown'}, {paymentMethod:'COD',shippingAddressId:10,isBuyNow:'true'}, {paymentMethod:'COD',shippingAddressId:10,requestedCurrency:'USD'}, {paymentMethod:'COD',shippingAddressId:10,shippingAddress:saved}, {paymentMethod:'COD',shippingAddress:{...saved,pincode:'bad'}}, {paymentMethod:'COD',shippingAddress:{...saved,country:'UAE'}}, {paymentMethod:'COD',shippingAddressId:10,isBuyNow:true,buyNowItem:{productId:1,quantity:-1}}])assert.equal((await call('placeOrder',body)).status,400);
 assert.equal(submitted,null);
});
test('inline addresses and valid variant buy-now request reach order placement',async()=>{
 const result=await call('placeOrder',{paymentMethod:'COD',shippingAddress:saved,isBuyNow:true,buyNowItem:{productId:1,variantId:2,quantity:1}});
 assert.equal(result.status,201);assert.equal(submitted.buyNowItem.variantId,2);
});
test('database failures go to generic error handling',async()=>{failure=true;assert.ok((await call('getCheckout')).error);});
