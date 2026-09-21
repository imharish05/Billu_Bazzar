'use strict';
module.exports = {
  "/mob-api/offers": {
    "get": {
      "tags": [
        "offers"
      ],
      "summary": "Active coupons",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "page",
          "in": "query",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
          }
        },
        {
          "name": "limit",
          "in": "query",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 20
          }
        },
        {
          "name": "subtotal",
          "in": "query",
          "schema": {
            "type": "number",
            "minimum": 0,
            "maximum": 99999999.99,
            "multipleOf": 0.01
          },
          "description": "Optional merchandise subtotal in the same currency as checkout, before delivery and tax."
        }
      ],
      "responses": {
        "200": {
          "description": "Successful customer coupon response"
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
      "description": "List active, currently valid coupons that have remaining redemptions for the authenticated customer. Optional subtotal also filters the minimum spend and returns discount previews. Does not redeem or create coupons."
    }
  },
  "/mob-api/offers/validate": {
    "post": {
      "tags": [
        "offers"
      ],
      "summary": "Validate a coupon",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Successful customer coupon response"
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
              "required": [
                "code",
                "subtotal"
              ],
              "properties": {
                "code": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 30,
                  "example": "WELCOME10"
                },
                "subtotal": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 99999999.99,
                  "multipleOf": 0.01,
                  "example": 1000
                }
              }
            }
          }
        }
      },
      "description": "Preview a discount using code and subtotal. Customer identity comes from the bearer token. No coupon is redeemed here. Send couponCode when placing the order; final amounts are calculated from server-side product prices. Cancelled orders do not count toward the per-customer usage limit; other order statuses do."
    }
  }
};
