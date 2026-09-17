'use strict';
module.exports = {
  "/mob-api/checkout/send-otp": {
    "post": {
      "summary": "Send checkout verification OTP",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Success"
        },
        "400": {
          "description": "Invalid request"
        },
        "401": {
          "description": "Customer login required"
        },
        "404": {
          "description": "Resource not found"
        }
      },
      "tags": [
        "checkout"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "required": [
                "email"
              ]
            }
          }
        }
      },
      "description": "Send checkout verification OTP. Customer authentication is required."
    }
  },
  "/mob-api/checkout/verify-otp": {
    "post": {
      "summary": "Verify checkout OTP",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Success"
        },
        "400": {
          "description": "Invalid request"
        },
        "401": {
          "description": "Customer login required"
        },
        "404": {
          "description": "Resource not found"
        }
      },
      "tags": [
        "checkout"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string"
                },
                "otp": {
                  "type": "string"
                }
              },
              "required": [
                "email",
                "otp"
              ]
            }
          }
        }
      },
      "description": "Verify checkout OTP. Customer authentication is required."
    }
  },
  "/mob-api/auth/send-checkout-otp": {
    "post": {
      "summary": "Send checkout verification OTP",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Success"
        },
        "400": {
          "description": "Invalid request"
        },
        "401": {
          "description": "Customer login required"
        },
        "404": {
          "description": "Resource not found"
        }
      },
      "tags": [
        "checkout"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "required": [
                "email"
              ]
            }
          }
        }
      },
      "description": "Send checkout verification OTP. Customer authentication is required."
    }
  },
  "/mob-api/auth/verify-checkout-otp": {
    "post": {
      "summary": "Verify checkout OTP",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Success"
        },
        "400": {
          "description": "Invalid request"
        },
        "401": {
          "description": "Customer login required"
        },
        "404": {
          "description": "Resource not found"
        }
      },
      "tags": [
        "checkout"
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "email": {
                  "type": "string"
                },
                "otp": {
                  "type": "string"
                }
              },
              "required": [
                "email",
                "otp"
              ]
            }
          }
        }
      },
      "description": "Verify checkout OTP. Customer authentication is required."
    }
  },
  "/mob-api/checkout": {
    "get": {
      "tags": [
        "checkout"
      ],
      "summary": "Checkout details",
      "description": "Return your cart with live stock flags and your saved addresses. defaultAddressId is a suggestion; send an explicit shippingAddressId when submitting. Cart subtotal is not the final order total: shipping, tax, coupons and loyalty are calculated when placing the order. No order is created by this request.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Checkout details"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "500": {
          "description": "Unable to load checkout"
        }
      }
    }
  },
  "/mob-api/checkout/place-order": {
    "post": {
      "tags": [
        "checkout"
      ],
      "summary": "Place checkout order",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Successful response using the existing customer API response format"
        },
        "201": {
          "description": "Created successfully"
        },
        "400": {
          "description": "Invalid request",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "401": {
          "description": "Missing, invalid, expired, or inactive customer token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "403": {
          "description": "Operation not permitted",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "404": {
          "description": "Resource not found or not owned by this customer",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "409": {
          "description": "Operation conflicts with current state",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "500": {
          "description": "Internal server error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        }
      },
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "shippingAddress": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "address": {
                      "type": "string"
                    },
                    "city": {
                      "type": "string"
                    },
                    "state": {
                      "type": "string"
                    },
                    "pincode": {
                      "type": "string"
                    },
                    "country": {
                      "type": "string"
                    }
                  },
                  "required": [],
                  "description": "Inline address requires name (or fullName), phone, address (or flatHouse), city, state, pincode and country. Email defaults to the signed-in customer email."
                },
                "billingAddress": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "address": {
                      "type": "string"
                    },
                    "city": {
                      "type": "string"
                    },
                    "state": {
                      "type": "string"
                    },
                    "pincode": {
                      "type": "string"
                    },
                    "country": {
                      "type": "string"
                    }
                  },
                  "required": [],
                  "description": "Inline address requires name (or fullName), phone, address (or flatHouse), city, state, pincode and country. Email defaults to the signed-in customer email."
                },
                "paymentMethod": {
                  "type": "string",
                  "enum": [
                    "COD",
                    "Cash on Delivery (COD)",
                    "Razorpay Secure Online",
                    "Telr Secure Online"
                  ]
                },
                "couponCode": {
                  "type": "string"
                },
                "referralCode": {
                  "type": "string"
                },
                "redeemPoints": {
                  "type": "number"
                },
                "isGiftWrap": {
                  "type": "boolean"
                },
                "giftMessage": {
                  "type": "string"
                },
                "notes": {
                  "type": "string"
                },
                "requestedCurrency": {
                  "type": "string",
                  "enum": [
                    "INR",
                    "AED"
                  ]
                },
                "geoCountry": {
                  "type": "string"
                },
                "isBuyNow": {
                  "type": "boolean",
                  "default": false
                },
                "buyNowItem": {
                  "type": "object",
                  "required": [
                    "productId",
                    "quantity"
                  ],
                  "properties": {
                    "productId": {
                      "type": "integer",
                      "minimum": 1
                    },
                    "variantId": {
                      "type": "integer",
                      "minimum": 1,
                      "nullable": true
                    },
                    "quantity": {
                      "type": "integer",
                      "minimum": 1
                    }
                  }
                },
                "shippingAddressId": {
                  "type": "integer",
                  "minimum": 1
                },
                "billingAddressId": {
                  "type": "integer",
                  "minimum": 1
                }
              },
              "required": [
                "paymentMethod"
              ],
              "oneOf": [
                {
                  "required": [
                    "shippingAddress"
                  ],
                  "not": {
                    "required": [
                      "shippingAddressId"
                    ]
                  }
                },
                {
                  "required": [
                    "shippingAddressId"
                  ],
                  "not": {
                    "required": [
                      "shippingAddress"
                    ]
                  }
                }
              ]
            }
          }
        }
      },
      "description": "Create an order from your saved cart, or an explicit buyNowItem. Use an owned shippingAddressId and optional billingAddressId, or inline addresses. Delivery requires an Indian address with a six-digit pincode. Prices, stock, discounts, shipping and tax are validated/calculated by the server. Saved addresses are copied into the order. Online orders require the initiate and verify payment steps; COD follows existing checkout rules."
    }
  },
  "/mob-api/checkout/payments/initiate": {
    "post": {
      "tags": [
        "checkout"
      ],
      "summary": "Initiate payment for my order",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Successful response using the existing customer API response format"
        },
        "400": {
          "description": "Invalid request",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "401": {
          "description": "Missing, invalid, expired, or inactive customer token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "403": {
          "description": "Operation not permitted",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "404": {
          "description": "Resource not found or not owned by this customer",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "409": {
          "description": "Operation conflicts with current state",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "500": {
          "description": "Internal server error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        }
      },
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "orderId": {
                  "type": "integer",
                  "minimum": 1
                }
              },
              "required": [
                "orderId"
              ]
            }
          }
        }
      },
      "description": "Create payment gateway details for your pending order. Uses the same contract as /mob-api/payments/initiate."
    }
  },
  "/mob-api/checkout/payments/verify": {
    "post": {
      "tags": [
        "checkout"
      ],
      "summary": "Verify payment for my order",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Successful response using the existing customer API response format"
        },
        "400": {
          "description": "Invalid request",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "401": {
          "description": "Missing, invalid, expired, or inactive customer token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "403": {
          "description": "Operation not permitted",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "404": {
          "description": "Resource not found or not owned by this customer",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "409": {
          "description": "Operation conflicts with current state",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        },
        "500": {
          "description": "Internal server error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              }
            }
          }
        }
      },
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "orderId": {
                  "type": "integer",
                  "minimum": 1
                },
                "razorpayPaymentId": {
                  "type": "string"
                },
                "razorpayOrderId": {
                  "type": "string"
                },
                "razorpaySignature": {
                  "type": "string"
                },
                "orderRef": {
                  "type": "string"
                }
              },
              "required": [
                "orderId"
              ]
            }
          }
        }
      },
      "description": "Verify your payment against your own order. Uses the same contract as /mob-api/payments/verify."
    }
  }
};
