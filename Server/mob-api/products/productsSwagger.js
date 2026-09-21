'use strict';
module.exports = {
  "/mob-api/variants": {
    "get": {
      "tags": ["products"],
      "summary": "Browse variants of active products",
      "description": "Paginated customer catalog variants. Warehouse and internal inventory details are excluded.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "page", "in": "query", "schema": { "type": "integer", "minimum": 1, "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Paginated variants" },
        "400": { "description": "Invalid pagination" },
        "401": { "description": "Customer authentication required" },
        "500": { "description": "Internal server error" }
      }
    }
  },
  "/mob-api/products": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Browse products with filters",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "q",
          "in": "query",
          "required": false,
          "description": "Product name search text. Required on /products/search; optional on /products.",
          "schema": {
            "type": "string",
            "maxLength": 200
          }
        },
        {
          "name": "categoryId",
          "in": "query",
          "required": false,
          "description": "Active category ID. Unknown IDs return 404; incompatible category/subcategory pairs return 400.",
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        },
        {
          "name": "subCategoryId",
          "in": "query",
          "required": false,
          "description": "Active subcategory ID. Unknown IDs return 404; incompatible category/subcategory pairs return 400.",
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        },
        {
          "name": "minPrice",
          "in": "query",
          "required": false,
          "description": "Inclusive INR product price bound. Uses product price, not individual variant prices.",
          "schema": {
            "type": "number",
            "minimum": 0
          }
        },
        {
          "name": "maxPrice",
          "in": "query",
          "required": false,
          "description": "Inclusive INR product price bound. Uses product price, not individual variant prices.",
          "schema": {
            "type": "number",
            "minimum": 0
          }
        },
        {
          "name": "collection",
          "in": "query",
          "required": false,
          "description": "new-arrivals, best-sellers, or featured. Comma-separated values match any selected collection; other filters still apply.",
          "schema": {
            "type": "string",
            "example": "new-arrivals,best-sellers"
          }
        },
        {
          "name": "minDiscount",
          "in": "query",
          "required": false,
          "description": "Inclusive discount percentage bound. Calculated from product price and comparePrice, rounded to a whole percentage. Products without a discount count as 0%.",
          "schema": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          }
        },
        {
          "name": "maxDiscount",
          "in": "query",
          "required": false,
          "description": "Inclusive discount percentage bound. Calculated from product price and comparePrice, rounded to a whole percentage. Products without a discount count as 0%.",
          "schema": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          }
        },
        {
          "name": "sort",
          "in": "query",
          "required": false,
          "description": "Price low to high, price high to low, newest first, or highest rating first.",
          "schema": {
            "type": "string",
            "enum": [
              "price_asc",
              "price_desc",
              "newest",
              "rating"
            ],
            "default": "newest"
          }
        },
        {
          "name": "page",
          "in": "query",
          "required": false,
          "description": "Results page, starting at 1.",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
          }
        },
        {
          "name": "limit",
          "in": "query",
          "required": false,
          "description": "Maximum products per page. The mobile request middleware caps larger limits at 100.",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 20
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Products and pagination, or an empty products array when no matches exist"
        },
        "400": {
          "description": "Invalid filter values, reversed ranges, missing search query, or a subcategory outside the selected category",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "minPrice must not exceed maxPrice"
              }
            }
          }
        },
        "401": {
          "description": "Missing or invalid customer access token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Authentication required"
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
          "description": "Selected category or subcategory does not exist or is inactive",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Category not found"
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
          "description": "Unable to fetch products due to a server error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Unable to fetch products"
              }
            }
          }
        }
      },
      "description": "Combine category, subcategory, product price, collection, discount percentage, and sorting filters. Returns full product records with variants and pagination. Valid requests with no matches return 200 and products: []. Requires a customer bearer token."
    }
  },
  "/mob-api/products/featured": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Featured products",
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
      }
    }
  },
  "/mob-api/products/search": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Search products with filters",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "q",
          "in": "query",
          "required": true,
          "description": "Product name search text. Required on /products/search; optional on /products.",
          "schema": {
            "type": "string",
            "maxLength": 200
          }
        },
        {
          "name": "categoryId",
          "in": "query",
          "required": false,
          "description": "Active category ID. Unknown IDs return 404; incompatible category/subcategory pairs return 400.",
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        },
        {
          "name": "subCategoryId",
          "in": "query",
          "required": false,
          "description": "Active subcategory ID. Unknown IDs return 404; incompatible category/subcategory pairs return 400.",
          "schema": {
            "type": "integer",
            "minimum": 1
          }
        },
        {
          "name": "minPrice",
          "in": "query",
          "required": false,
          "description": "Inclusive INR product price bound. Uses product price, not individual variant prices.",
          "schema": {
            "type": "number",
            "minimum": 0
          }
        },
        {
          "name": "maxPrice",
          "in": "query",
          "required": false,
          "description": "Inclusive INR product price bound. Uses product price, not individual variant prices.",
          "schema": {
            "type": "number",
            "minimum": 0
          }
        },
        {
          "name": "collection",
          "in": "query",
          "required": false,
          "description": "new-arrivals, best-sellers, or featured. Comma-separated values match any selected collection; other filters still apply.",
          "schema": {
            "type": "string",
            "example": "new-arrivals,best-sellers"
          }
        },
        {
          "name": "minDiscount",
          "in": "query",
          "required": false,
          "description": "Inclusive discount percentage bound. Calculated from product price and comparePrice, rounded to a whole percentage. Products without a discount count as 0%.",
          "schema": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          }
        },
        {
          "name": "maxDiscount",
          "in": "query",
          "required": false,
          "description": "Inclusive discount percentage bound. Calculated from product price and comparePrice, rounded to a whole percentage. Products without a discount count as 0%.",
          "schema": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          }
        },
        {
          "name": "sort",
          "in": "query",
          "required": false,
          "description": "Price low to high, price high to low, newest first, or highest rating first.",
          "schema": {
            "type": "string",
            "enum": [
              "price_asc",
              "price_desc",
              "newest",
              "rating"
            ],
            "default": "newest"
          }
        },
        {
          "name": "page",
          "in": "query",
          "required": false,
          "description": "Results page, starting at 1.",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
          }
        },
        {
          "name": "limit",
          "in": "query",
          "required": false,
          "description": "Maximum products per page. The mobile request middleware caps larger limits at 100.",
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 20
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Products and pagination, or an empty products array when no matches exist"
        },
        "400": {
          "description": "Invalid filter values, reversed ranges, missing search query, or a subcategory outside the selected category",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "minPrice must not exceed maxPrice"
              }
            }
          }
        },
        "401": {
          "description": "Missing or invalid customer access token",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Authentication required"
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
          "description": "Selected category or subcategory does not exist or is inactive",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Category not found"
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
          "description": "Unable to fetch products due to a server error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Error"
              },
              "example": {
                "success": false,
                "message": "Unable to fetch products"
              }
            }
          }
        }
      },
      "description": "Combine category, subcategory, product price, collection, discount percentage, and sorting filters. Returns full product records with variants and pagination. Valid requests with no matches return 200 and products: []. Requires a customer bearer token."
    }
  },
  "/mob-api/products/price-range": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Product price range",
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
      }
    }
  },
  "/mob-api/products/{slug}": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Product details by slug",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "slug",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
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
      }
    }
  },
  "/mob-api/variants/product/{productId}": {
    "get": {
      "tags": [
        "products"
      ],
      "summary": "Variants of an active product",
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "productId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
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
      }
    }
  }
};
