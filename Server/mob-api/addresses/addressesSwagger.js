'use strict';
module.exports = {
  "/mob-api/addresses": {
    "get": {
      "tags": [
        "addresses"
      ],
      "summary": "My saved addresses",
      "description": "List only your saved addresses, with the default first.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "200": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      }
    },
    "post": {
      "tags": [
        "addresses"
      ],
      "summary": "Save an address",
      "description": "Create an address. The first address is automatically default. Customer ownership is taken from the token.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [],
      "responses": {
        "201": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      },
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "label": {
                  "type": "string",
                  "maxLength": 40
                },
                "name": {
                  "type": "string",
                  "maxLength": 120
                },
                "phone": {
                  "type": "string",
                  "maxLength": 20
                },
                "email": {
                  "type": "string",
                  "maxLength": 180
                },
                "address": {
                  "type": "string",
                  "maxLength": 255
                },
                "addressLine2": {
                  "type": "string",
                  "maxLength": 255
                },
                "landmark": {
                  "type": "string",
                  "maxLength": 120
                },
                "city": {
                  "type": "string",
                  "maxLength": 100
                },
                "state": {
                  "type": "string",
                  "maxLength": 100
                },
                "pincode": {
                  "type": "string",
                  "maxLength": 20
                },
                "country": {
                  "type": "string",
                  "maxLength": 100
                },
                "isDefault": {
                  "type": "boolean"
                }
              },
              "required": [
                "name",
                "phone",
                "address",
                "city",
                "state",
                "pincode",
                "country"
              ]
            }
          }
        }
      }
    }
  },
  "/mob-api/addresses/{addressId}": {
    "get": {
      "tags": [
        "addresses"
      ],
      "summary": "Saved address details",
      "description": "Get an address owned by the authenticated customer.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "addressId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      }
    },
    "put": {
      "tags": [
        "addresses"
      ],
      "summary": "Update saved address",
      "description": "Partial update. Set isDefault=true to select this address. To unset the current default, select another address first.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "addressId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      },
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "label": {
                  "type": "string",
                  "maxLength": 40
                },
                "name": {
                  "type": "string",
                  "maxLength": 120
                },
                "phone": {
                  "type": "string",
                  "maxLength": 20
                },
                "email": {
                  "type": "string",
                  "maxLength": 180
                },
                "address": {
                  "type": "string",
                  "maxLength": 255
                },
                "addressLine2": {
                  "type": "string",
                  "maxLength": 255
                },
                "landmark": {
                  "type": "string",
                  "maxLength": 120
                },
                "city": {
                  "type": "string",
                  "maxLength": 100
                },
                "state": {
                  "type": "string",
                  "maxLength": 100
                },
                "pincode": {
                  "type": "string",
                  "maxLength": 20
                },
                "country": {
                  "type": "string",
                  "maxLength": 100
                },
                "isDefault": {
                  "type": "boolean"
                }
              },
              "minProperties": 1
            }
          }
        }
      }
    },
    "delete": {
      "tags": [
        "addresses"
      ],
      "summary": "Delete saved address",
      "description": "Delete an owned address. If it was default, the oldest remaining address becomes default. Existing order snapshots are unchanged.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "addressId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      }
    }
  },
  "/mob-api/addresses/{addressId}/default": {
    "put": {
      "tags": [
        "addresses"
      ],
      "summary": "Set default address",
      "description": "Atomically select the default. Repeated calls are safe.",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "addressId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Successful response"
        },
        "400": {
          "description": "Invalid address input"
        },
        "401": {
          "description": "Customer authentication required"
        },
        "404": {
          "description": "Saved address not found or not owned by customer"
        },
        "500": {
          "description": "Internal server error"
        }
      }
    }
  }
};
