/* eslint-disable @typescript-eslint/no-explicit-any */

/* =====================================================
   REUSABLE COMPONENTS
===================================================== */

const UUIDParam = (name: string, description: string): any => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});

const PaginationParams: any[] = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
  { name: "search", in: "query", schema: { type: "string" } },
];

const ok = (schema: any) => ({
  "200": {
    description: "Success",
    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, data: schema } } } },
  },
});

const created = (schema: any) => ({
  "201": {
    description: "Created",
    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string" }, data: schema } } } },
  },
});

const okMsg = (message = "Success") => ({
  "200": {
    description: message,
    content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: message } } } } },
  },
});

const errorResponses: Record<string, any> = {
  "400": {
    description: "Validation error",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ValidationError" },
      },
    },
  },
  "401": {
    description: "Unauthorized — missing or invalid session cookie",
    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthError" } } },
  },
  "403": {
    description: "Forbidden — authenticated but missing permission",
    content: { "application/json": { schema: { $ref: "#/components/schemas/AppError" } } },
  },
  "404": {
    description: "Not found",
    content: { "application/json": { schema: { $ref: "#/components/schemas/AppError" } } },
  },
  "500": {
    description: "Internal server error",
    content: { "application/json": { schema: { $ref: "#/components/schemas/InternalError" } } },
  },
};

/* =====================================================
   SPEC
===================================================== */

export const swaggerSpec: Record<string, any> = {
  openapi: "3.0.3",
  info: {
    title: "Bizion Backend API",
    version: "1.0.0",
    description: `
## Authentication
All protected endpoints use **cookie-based JWT authentication**.
Login via \`POST /v1/auth/login\` — the server sets an \`httpOnly\` cookie named \`token\` automatically.

> **Important:** Enable **"Send cookies"** in your HTTP client (Postman: Cookies tab, fetch: \`credentials: "include"\`, axios: \`withCredentials: true\`).

## Errors
All errors follow a consistent envelope:
\`\`\`json
{ "success": false, "type": "ERROR_TYPE", "message": "...", "errors": {} }
\`\`\`

## Rate Limits
- **Global:** 1000 requests / 15 min
- **Auth endpoints:** 5 failed attempts / 15 min
    `,
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Health", description: "Service health" },
    { name: "Auth", description: "Login, logout, password management" },
    { name: "Public", description: "Public-facing endpoints — no auth required" },
    { name: "Users", description: "User management" },
    { name: "Roles", description: "Role and permission management" },
    { name: "Products", description: "Product CRUD" },
    { name: "Variants", description: "Product variant management" },
    { name: "Images", description: "Product and variant image uploads" },
    { name: "Categories", description: "Product category management" },
    { name: "Brands", description: "Brand management" },
    { name: "Units", description: "Unit of measurement management" },
    { name: "Options", description: "Product option and option value management" },
    { name: "HSN", description: "HSN code management (India GST)" },
    { name: "GST", description: "GST group and rate management" },
    { name: "Carousel", description: "Homepage carousel / banner management" },
  ],
  components: {
    schemas: {
      /* ---- Error shapes ---- */
      ValidationError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          type: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
            example: { email: ["Invalid email address"], password: ["Min 8 characters"] },
          },
        },
      },
      AuthError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          type: { type: "string", example: "AUTH_ERROR" },
          message: { type: "string", example: "Unauthorized" },
        },
      },
      AppError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          type: { type: "string", example: "APP_ERROR" },
          message: { type: "string", example: "Resource not found" },
        },
      },
      InternalError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          type: { type: "string", example: "INTERNAL_ERROR" },
          message: { type: "string", example: "Something went wrong" },
        },
      },

      /* ---- Domain schemas ---- */
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          roleId: { type: "string", format: "uuid" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "admin" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Permission: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string", example: "product:create" },
          description: { type: "string" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          categoryName: { type: "string" },
          parentId: { type: "string", format: "uuid", nullable: true },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      CategoryTree: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          categoryName: { type: "string" },
          parentId: { type: "string", format: "uuid", nullable: true },
          description: { type: "string", nullable: true },
          children: { type: "array", items: { $ref: "#/components/schemas/CategoryTree" } },
        },
      },
      Brand: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          brandName: { type: "string" },
          brandLogo: { type: "string", nullable: true, description: "S3 key path" },
        },
      },
      Unit: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          unitName: { type: "string", example: "Gram" },
          unitSymbol: { type: "string", example: "g", nullable: true },
        },
      },
      Option: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          optionName: { type: "string", example: "Size" },
          values: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                optionValue: { type: "string", example: "M" },
                position: { type: "integer" },
              },
            },
          },
        },
      },
      HsnCode: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          hsnCode: { type: "string", example: "7113" },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      GstGroup: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "GST 3%" },
          isActive: { type: "boolean" },
        },
      },
      GstRate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          gstGroupId: { type: "string", format: "uuid" },
          cgst: { type: "number", example: 1.5 },
          sgst: { type: "number", example: 1.5 },
          igst: { type: "number", example: 3.0 },
          effectiveFrom: { type: "string", format: "date-time" },
          effectiveTo: { type: "string", format: "date-time", nullable: true },
        },
      },
      CarouselItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          image: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      VariantRate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          mrp: { type: "string", example: "999.00", nullable: true },
          saleRate: { type: "string", example: "850.00", nullable: true },
          purchaseRate: { type: "string", example: "700.00", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Variant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sku: { type: "string", nullable: true },
          packing: { type: "integer", nullable: true },
          mrp: { type: "string", nullable: true, description: "Numeric string — parse before arithmetic" },
          saleRate: { type: "string", nullable: true },
          purchaseRate: { type: "string", nullable: true },
          options: {
            type: "object",
            additionalProperties: { type: "string" },
            example: { Size: "M", Finish: "Gold" },
          },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          model: { type: "string" },
          metal: { type: "string", nullable: true },
          shortDescription: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          slug: { type: "string", nullable: true },
          sizeType: { type: "string", nullable: true },
          status: { type: "string", enum: ["draft", "active", "archived"] },
          isActive: { type: "boolean" },
          isFeatured: { type: "boolean" },
          isNew: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          brand: { $ref: "#/components/schemas/Brand", nullable: true },
          category: { $ref: "#/components/schemas/Category", nullable: true },
          image: {
            type: "object",
            nullable: true,
            properties: { url: { type: "string", example: "https://cdn.example.com/products/file.jpg" } },
          },
        },
      },
      ProductDetail: {
        allOf: [
          { $ref: "#/components/schemas/Product" },
          {
            type: "object",
            properties: {
              hsn: { type: "object", nullable: true, properties: { hsnCode: { type: "string" } } },
              unit: { type: "object", nullable: true, properties: { unitName: { type: "string" }, unitSymbol: { type: "string" } } },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Size" },
                    values: { type: "array", items: { type: "string" }, example: ["S", "M", "L"] },
                  },
                },
              },
              variants: { type: "array", items: { $ref: "#/components/schemas/Variant" } },
            },
          },
        ],
      },
      Paginated: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "array", items: {} },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 100 },
              totalPages: { type: "integer", example: 10 },
            },
          },
        },
      },
    },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "Set automatically by POST /auth/login. Enable 'Send cookies' in your HTTP client.",
      },
    },
  },

  security: [],

  paths: {
    /* =====================================================
       HEALTH
    ===================================================== */
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          "200": {
            description: "Service is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API is running" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    /* =====================================================
       AUTH
    ===================================================== */
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "roleId"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8, description: "Min 8 chars, 1 upper, 1 lower, 1 number, 1 special" },
                  roleId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          ...created({ $ref: "#/components/schemas/User" }),
          ...errorResponses,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login — sets httpOnly cookie",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful — sets `token` cookie",
            headers: {
              "Set-Cookie": {
                schema: { type: "string", example: "token=eyJ...; HttpOnly; SameSite=Lax; Max-Age=3600" },
              },
            },
            content: {
              "application/json": {
                schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string", example: "Login successful" } } },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout — clears cookie",
        security: [{ cookieAuth: [] }],
        responses: { ...okMsg("Logged out"), ...errorResponses },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ cookieAuth: [] }],
        responses: { ...ok({ $ref: "#/components/schemas/User" }), ...errorResponses },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
            },
          },
        },
        responses: { ...okMsg("If email exists, reset link sent"), ...errorResponses },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using token from email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                  token: { type: "string", minLength: 10 },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: { ...okMsg("Password reset successful"), ...errorResponses },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password (authenticated)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: { ...okMsg("Password changed"), ...errorResponses },
      },
    },

    /* =====================================================
       PUBLIC
    ===================================================== */
    "/public/carousel": {
      get: {
        tags: ["Public"],
        summary: "Active carousel items",
        security: [],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/CarouselItem" } }), ...errorResponses },
      },
    },
    "/public/categories": {
      get: {
        tags: ["Public"],
        summary: "Category tree (parent → children)",
        security: [],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/CategoryTree" } }), ...errorResponses },
      },
    },
    "/public/brands": {
      get: {
        tags: ["Public"],
        summary: "All brands sorted by name",
        security: [],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Brand" } }), ...errorResponses },
      },
    },
    "/public/products": {
      get: {
        tags: ["Public"],
        summary: "Paginated product listing",
        security: [],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Matches model name" },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "brandId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["model_asc", "model_desc", "newest"], default: "model_asc" } },
        ],
        responses: {
          "200": {
            description: "Paginated products",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/Paginated" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
                  ],
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/public/products/catalog": {
      get: {
        tags: ["Public"],
        summary: "Full catalog — brand → category → products → variants",
        security: [],
        parameters: [
          { name: "brandId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Nested catalog",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          brandName: { type: "string" },
                          brandLogo: { type: "string", nullable: true },
                          categories: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string", format: "uuid" },
                                categoryName: { type: "string" },
                                products: {
                                  type: "array",
                                  items: {
                                    allOf: [
                                      { $ref: "#/components/schemas/Product" },
                                      { type: "object", properties: { variants: { type: "array", items: { $ref: "#/components/schemas/Variant" } } } },
                                    ],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    "/public/products/{id}": {
      get: {
        tags: ["Public"],
        summary: "Product detail with variants and options",
        security: [],
        parameters: [UUIDParam("id", "Product ID")],
        responses: { ...ok({ $ref: "#/components/schemas/ProductDetail" }), ...errorResponses },
      },
    },

    /* =====================================================
       PRODUCTS
    ===================================================== */
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products (admin)",
        security: [{ cookieAuth: [] }],
        parameters: [
          ...PaginationParams,
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "brandId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "active", "archived"] } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
          { name: "isFeatured", in: "query", schema: { type: "boolean" } },
          { name: "isNew", in: "query", schema: { type: "boolean" } },
        ],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Product" } }), ...errorResponses },
      },
      post: {
        tags: ["Products"],
        summary: "Create product",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["model", "categoryId"],
                properties: {
                  model: { type: "string" },
                  categoryId: { type: "string", format: "uuid" },
                  brandId: { type: "string", format: "uuid" },
                  hsnId: { type: "string", format: "uuid" },
                  unitId: { type: "string", format: "uuid" },
                  metal: { type: "string" },
                  shortDescription: { type: "string" },
                  description: { type: "string" },
                  sizeType: { type: "string" },
                  status: { type: "string", enum: ["draft", "active", "archived"], default: "draft" },
                  isActive: { type: "boolean", default: true },
                  isFeatured: { type: "boolean", default: false },
                  isNew: { type: "boolean", default: false },
                  variants: {
                    type: "array",
                    default: [],
                    items: {
                      type: "object",
                      properties: {
                        sku: { type: "string" },
                        packing: { type: "integer" },
                        optionValueIds: { type: "array", items: { type: "string", format: "uuid" } },
                        rates: {
                          type: "object",
                          properties: {
                            mrp: { type: "number" },
                            saleRate: { type: "number" },
                            purchaseRate: { type: "number" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Product" }), ...errorResponses },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Product ID")],
        responses: { ...ok({ $ref: "#/components/schemas/ProductDetail" }), ...errorResponses },
      },
      patch: {
        tags: ["Products"],
        summary: "Update product (partial)",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Product ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  model: { type: "string" },
                  categoryId: { type: "string", format: "uuid" },
                  brandId: { type: "string", format: "uuid" },
                  hsnId: { type: "string", format: "uuid" },
                  unitId: { type: "string", format: "uuid" },
                  metal: { type: "string" },
                  shortDescription: { type: "string" },
                  description: { type: "string" },
                  sizeType: { type: "string" },
                  status: { type: "string", enum: ["draft", "active", "archived"] },
                  isActive: { type: "boolean" },
                  isFeatured: { type: "boolean" },
                  isNew: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Product" }), ...errorResponses },
      },
      delete: {
        tags: ["Products"],
        summary: "Soft delete product",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Product ID")],
        responses: { ...okMsg("Product deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       VARIANTS
    ===================================================== */
    "/variants/{id}": {
      get: {
        tags: ["Variants"],
        summary: "Get variant by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Variant" }), ...errorResponses },
      },
      patch: {
        tags: ["Variants"],
        summary: "Update variant sku / packing",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sku: { type: "string" },
                  packing: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Variant" }), ...errorResponses },
      },
      delete: {
        tags: ["Variants"],
        summary: "Delete variant",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        responses: { ...okMsg("Variant deleted"), ...errorResponses },
      },
    },
    "/variants/product/{productId}": {
      post: {
        tags: ["Variants"],
        summary: "Add variant to product",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("productId", "Product ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sku: { type: "string" },
                  packing: { type: "integer", minimum: 1 },
                  optionValueIds: { type: "array", items: { type: "string", format: "uuid" } },
                  rates: {
                    type: "object",
                    properties: {
                      mrp: { type: "number", minimum: 0 },
                      saleRate: { type: "number", minimum: 0 },
                      purchaseRate: { type: "number", minimum: 0 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Variant" }), ...errorResponses },
      },
    },
    "/variants/{id}/rates": {
      post: {
        tags: ["Variants"],
        summary: "Add price entry to variant",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  mrp: { type: "number", minimum: 0 },
                  saleRate: { type: "number", minimum: 0 },
                  purchaseRate: { type: "number", minimum: 0 },
                  effectiveFrom: { type: "string", format: "date-time" },
                  effectiveTo: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/VariantRate" }), ...errorResponses },
      },
    },
    "/variants/{id}/rates/{rateId}": {
      delete: {
        tags: ["Variants"],
        summary: "Delete a price entry",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID"), UUIDParam("rateId", "Rate ID")],
        responses: { ...okMsg("Rate deleted"), ...errorResponses },
      },
    },
    "/variants/{id}/options": {
      put: {
        tags: ["Variants"],
        summary: "Bulk assign option values to variant",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["optionValueIds"],
                properties: { optionValueIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 } },
              },
            },
          },
        },
        responses: { ...okMsg("Option values assigned"), ...errorResponses },
      },
    },
    "/variants/{id}/options/{optionValueId}": {
      delete: {
        tags: ["Variants"],
        summary: "Remove option value from variant",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID"), UUIDParam("optionValueId", "Option Value ID")],
        responses: { ...okMsg("Option value removed"), ...errorResponses },
      },
    },

    /* =====================================================
       IMAGES
    ===================================================== */
    "/images/products/{id}/image": {
      post: {
        tags: ["Images"],
        summary: "Upload product image (replaces existing)",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Product ID")],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: { image: { type: "string", format: "binary", description: "Max 5MB · jpg/jpeg/png/webp" } },
              },
            },
          },
        },
        responses: {
          ...created({ type: "object", properties: { url: { type: "string", example: "https://cdn.example.com/products/file.jpg" } } }),
          ...errorResponses,
        },
      },
      delete: {
        tags: ["Images"],
        summary: "Delete product image",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Product ID")],
        responses: { ...okMsg("Image deleted"), ...errorResponses },
      },
    },
    "/images/variants/{id}/images": {
      post: {
        tags: ["Images"],
        summary: "Upload variant image (multiple allowed)",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID")],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: { image: { type: "string", format: "binary", description: "Max 5MB · jpg/jpeg/png/webp" } },
              },
            },
          },
        },
        responses: {
          ...created({
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              productVariantId: { type: "string", format: "uuid" },
              path: { type: "string", description: "S3 key" },
              url: { type: "string", example: "https://cdn.example.com/products/file.jpg" },
            },
          }),
          ...errorResponses,
        },
      },
    },
    "/images/variants/{id}/images/{imageId}": {
      delete: {
        tags: ["Images"],
        summary: "Delete variant image",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Variant ID"), UUIDParam("imageId", "Image ID")],
        responses: { ...okMsg("Image deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       CATEGORIES
    ===================================================== */
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories (admin)",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Category" } }), ...errorResponses },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categoryName"],
                properties: {
                  categoryName: { type: "string" },
                  parentId: { type: "string", format: "uuid", nullable: true },
                  description: { type: "string" },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Category" }), ...errorResponses },
      },
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Category ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Category" }), ...errorResponses },
      },
      put: {
        tags: ["Categories"],
        summary: "Update category",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Category ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  categoryName: { type: "string" },
                  parentId: { type: "string", format: "uuid", nullable: true },
                  description: { type: "string" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Category" }), ...errorResponses },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Category ID")],
        responses: { ...okMsg("Category deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       BRANDS
    ===================================================== */
    "/brands": {
      get: {
        tags: ["Brands"],
        summary: "List brands",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Brand" } }), ...errorResponses },
      },
      post: {
        tags: ["Brands"],
        summary: "Create brand",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["brandName"],
                properties: {
                  brandName: { type: "string" },
                  brandLogo: { type: "string", description: "S3 key path" },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Brand" }), ...errorResponses },
      },
    },
    "/brands/{id}": {
      get: {
        tags: ["Brands"],
        summary: "Get brand by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Brand ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Brand" }), ...errorResponses },
      },
      patch: {
        tags: ["Brands"],
        summary: "Update brand",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Brand ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { brandName: { type: "string" }, brandLogo: { type: "string" } },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Brand" }), ...errorResponses },
      },
      delete: {
        tags: ["Brands"],
        summary: "Delete brand",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Brand ID")],
        responses: { ...okMsg("Brand deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       UNITS
    ===================================================== */
    "/units": {
      get: {
        tags: ["Units"],
        summary: "List units",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Unit" } }), ...errorResponses },
      },
      post: {
        tags: ["Units"],
        summary: "Create unit",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["unitName"],
                properties: {
                  unitName: { type: "string" },
                  unitSymbol: { type: "string" },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Unit" }), ...errorResponses },
      },
    },
    "/units/{id}": {
      get: {
        tags: ["Units"],
        summary: "Get unit by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Unit ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Unit" }), ...errorResponses },
      },
      patch: {
        tags: ["Units"],
        summary: "Update unit",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Unit ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { unitName: { type: "string" }, unitSymbol: { type: "string" } } },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Unit" }), ...errorResponses },
      },
      delete: {
        tags: ["Units"],
        summary: "Delete unit",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Unit ID")],
        responses: { ...okMsg("Unit deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       OPTIONS
    ===================================================== */
    "/options": {
      get: {
        tags: ["Options"],
        summary: "List options",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Option" } }), ...errorResponses },
      },
      post: {
        tags: ["Options"],
        summary: "Create option (e.g. Size, Finish)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["optionName"], properties: { optionName: { type: "string" } } },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Option" }), ...errorResponses },
      },
    },
    "/options/{id}": {
      get: {
        tags: ["Options"],
        summary: "Get option by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Option" }), ...errorResponses },
      },
      patch: {
        tags: ["Options"],
        summary: "Update option name",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["optionName"], properties: { optionName: { type: "string" } } },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Option" }), ...errorResponses },
      },
      delete: {
        tags: ["Options"],
        summary: "Delete option",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID")],
        responses: { ...okMsg("Option deleted"), ...errorResponses },
      },
    },
    "/options/{id}/values": {
      post: {
        tags: ["Options"],
        summary: "Add value to option",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["optionValue"],
                properties: {
                  optionValue: { type: "string" },
                  position: { type: "integer", minimum: 0, default: 0 },
                },
              },
            },
          },
        },
        responses: { ...created({ type: "object" }), ...errorResponses },
      },
    },
    "/options/{id}/values/{valueId}": {
      patch: {
        tags: ["Options"],
        summary: "Update option value",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID"), UUIDParam("valueId", "Value ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { optionValue: { type: "string" }, position: { type: "integer", minimum: 0 } },
              },
            },
          },
        },
        responses: { ...ok({ type: "object" }), ...errorResponses },
      },
      delete: {
        tags: ["Options"],
        summary: "Delete option value",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Option ID"), UUIDParam("valueId", "Value ID")],
        responses: { ...okMsg("Option value deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       HSN
    ===================================================== */
    "/hsn": {
      get: {
        tags: ["HSN"],
        summary: "List active HSN codes",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/HsnCode" } }), ...errorResponses },
      },
      post: {
        tags: ["HSN"],
        summary: "Create HSN code",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["hsnCode"],
                properties: {
                  hsnCode: { type: "string", pattern: "^\\d+$", minLength: 4, maxLength: 10, example: "7113" },
                  description: { type: "string", maxLength: 255 },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/HsnCode" }), ...errorResponses },
      },
    },
    "/hsn/{id}": {
      get: {
        tags: ["HSN"],
        summary: "Get HSN code by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "HSN ID")],
        responses: { ...ok({ $ref: "#/components/schemas/HsnCode" }), ...errorResponses },
      },
      patch: {
        tags: ["HSN"],
        summary: "Update HSN code",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "HSN ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { description: { type: "string", maxLength: 255 }, isActive: { type: "boolean" } },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/HsnCode" }), ...errorResponses },
      },
      delete: {
        tags: ["HSN"],
        summary: "Deactivate HSN code",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "HSN ID")],
        responses: { ...okMsg("HSN code deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       GST
    ===================================================== */
    "/gst/groups": {
      get: {
        tags: ["GST"],
        summary: "List GST groups",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/GstGroup" } }), ...errorResponses },
      },
      post: {
        tags: ["GST"],
        summary: "Create GST group",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string", maxLength: 50 }, isActive: { type: "boolean", default: true } },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/GstGroup" }), ...errorResponses },
      },
    },
    "/gst/groups/{id}": {
      get: {
        tags: ["GST"],
        summary: "Get GST group by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Group ID")],
        responses: { ...ok({ $ref: "#/components/schemas/GstGroup" }), ...errorResponses },
      },
      patch: {
        tags: ["GST"],
        summary: "Update GST group",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Group ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { name: { type: "string" }, isActive: { type: "boolean" } } },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/GstGroup" }), ...errorResponses },
      },
      delete: {
        tags: ["GST"],
        summary: "Delete GST group",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Group ID")],
        responses: { ...okMsg("GST group deleted"), ...errorResponses },
      },
    },
    "/gst/rates": {
      get: {
        tags: ["GST"],
        summary: "List GST rates",
        security: [{ cookieAuth: [] }],
        parameters: [
          ...PaginationParams,
          { name: "gstGroupId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/GstRate" } }), ...errorResponses },
      },
      post: {
        tags: ["GST"],
        summary: "Create GST rate",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["gstGroupId", "cgst", "sgst", "igst", "effectiveFrom"],
                properties: {
                  gstGroupId: { type: "string", format: "uuid" },
                  cgst: { type: "number", minimum: 0, maximum: 100 },
                  sgst: { type: "number", minimum: 0, maximum: 100 },
                  igst: { type: "number", minimum: 0, maximum: 100 },
                  effectiveFrom: { type: "string", format: "date-time" },
                  effectiveTo: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/GstRate" }), ...errorResponses },
      },
    },
    "/gst/rates/{id}": {
      get: {
        tags: ["GST"],
        summary: "Get GST rate by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Rate ID")],
        responses: { ...ok({ $ref: "#/components/schemas/GstRate" }), ...errorResponses },
      },
      patch: {
        tags: ["GST"],
        summary: "Update GST rate",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Rate ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  cgst: { type: "number", minimum: 0, maximum: 100 },
                  sgst: { type: "number", minimum: 0, maximum: 100 },
                  igst: { type: "number", minimum: 0, maximum: 100 },
                  effectiveFrom: { type: "string", format: "date-time" },
                  effectiveTo: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/GstRate" }), ...errorResponses },
      },
      delete: {
        tags: ["GST"],
        summary: "Delete GST rate",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "GST Rate ID")],
        responses: { ...okMsg("GST rate deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       CAROUSEL
    ===================================================== */
    "/carousel": {
      get: {
        tags: ["Carousel"],
        summary: "List carousel items",
        security: [{ cookieAuth: [] }],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/CarouselItem" } }), ...errorResponses },
      },
      post: {
        tags: ["Carousel"],
        summary: "Create carousel item",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  image: { type: "string" },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/CarouselItem" }), ...errorResponses },
      },
    },
    "/carousel/{id}": {
      get: {
        tags: ["Carousel"],
        summary: "Get carousel item by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Carousel Item ID")],
        responses: { ...ok({ $ref: "#/components/schemas/CarouselItem" }), ...errorResponses },
      },
      patch: {
        tags: ["Carousel"],
        summary: "Update carousel item",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Carousel Item ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  image: { type: "string" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/CarouselItem" }), ...errorResponses },
      },
      delete: {
        tags: ["Carousel"],
        summary: "Delete carousel item",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Carousel Item ID")],
        responses: { ...okMsg("Carousel item deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       USERS
    ===================================================== */
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ cookieAuth: [] }],
        parameters: [
          ...PaginationParams,
          { name: "roleId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "isActive", in: "query", schema: { type: "boolean" } },
        ],
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/User" } }), ...errorResponses },
      },
      post: {
        tags: ["Users"],
        summary: "Create user",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "roleId"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  roleId: { type: "string", format: "uuid" },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/User" }), ...errorResponses },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "User ID")],
        responses: { ...ok({ $ref: "#/components/schemas/User" }), ...errorResponses },
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "User ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  roleId: { type: "string", format: "uuid" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/User" }), ...errorResponses },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "User ID")],
        responses: { ...okMsg("User deleted"), ...errorResponses },
      },
    },

    /* =====================================================
       ROLES
    ===================================================== */
    "/roles": {
      get: {
        tags: ["Roles"],
        summary: "List roles",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Role" } }), ...errorResponses },
      },
      post: {
        tags: ["Roles"],
        summary: "Create role",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Role" }), ...errorResponses },
      },
    },
    "/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Get role by ID",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Role ID")],
        responses: { ...ok({ $ref: "#/components/schemas/Role" }), ...errorResponses },
      },
      patch: {
        tags: ["Roles"],
        summary: "Update role",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Role ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Role" }), ...errorResponses },
      },
      delete: {
        tags: ["Roles"],
        summary: "Delete role",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Role ID")],
        responses: { ...okMsg("Role deleted"), ...errorResponses },
      },
    },
    "/roles/{id}/permissions": {
      put: {
        tags: ["Roles"],
        summary: "Bulk assign permissions to role",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Role ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["permissionIds"],
                properties: { permissionIds: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1 } },
              },
            },
          },
        },
        responses: { ...okMsg("Permissions assigned"), ...errorResponses },
      },
    },
    "/roles/{id}/permissions/{permissionId}": {
      delete: {
        tags: ["Roles"],
        summary: "Revoke a permission from role",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Role ID"), UUIDParam("permissionId", "Permission ID")],
        responses: { ...okMsg("Permission revoked"), ...errorResponses },
      },
    },
    "/roles/permissions/list": {
      get: {
        tags: ["Roles"],
        summary: "List all permission codes",
        security: [{ cookieAuth: [] }],
        parameters: PaginationParams,
        responses: { ...ok({ type: "array", items: { $ref: "#/components/schemas/Permission" } }), ...errorResponses },
      },
    },
    "/roles/permissions": {
      post: {
        tags: ["Roles"],
        summary: "Create permission code",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string", example: "product:create" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { ...created({ $ref: "#/components/schemas/Permission" }), ...errorResponses },
      },
    },
    "/roles/permissions/{id}": {
      patch: {
        tags: ["Roles"],
        summary: "Update permission",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Permission ID")],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { code: { type: "string" }, description: { type: "string" } },
              },
            },
          },
        },
        responses: { ...ok({ $ref: "#/components/schemas/Permission" }), ...errorResponses },
      },
      delete: {
        tags: ["Roles"],
        summary: "Delete permission",
        security: [{ cookieAuth: [] }],
        parameters: [UUIDParam("id", "Permission ID")],
        responses: { ...okMsg("Permission deleted"), ...errorResponses },
      },
    },
  },
};
