export const dynamic = "force-dynamic";

import { ENGINE_VERSION } from "@/lib/engine/engine-version";

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Estimation Manager API",
      version: ENGINE_VERSION,
      description:
        "REST API for the Estimation Manager. Authenticate with the X-API-Key header.",
    },
    servers: [{ url: "/api/v1" }],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
      schemas: {
        Band: {
          type: "object",
          required: ["low", "expected", "high"],
          properties: {
            low: { type: "number" },
            expected: { type: "number" },
            high: { type: "number" },
          },
        },
        CostDriverItem: {
          type: "object",
          required: ["count", "complexity"],
          properties: {
            count: { type: "integer", minimum: 0 },
            complexity: { type: "string", enum: ["low", "medium", "high"] },
          },
        },
        EstimationInput: {
          type: "object",
          required: ["masks", "useCases", "businessObjects", "interfaces", "batches", "roles", "users", "languages", "currency"],
          properties: {
            masks: { $ref: "#/components/schemas/CostDriverItem" },
            useCases: { $ref: "#/components/schemas/CostDriverItem" },
            businessObjects: { $ref: "#/components/schemas/CostDriverItem" },
            interfaces: { $ref: "#/components/schemas/CostDriverItem" },
            batches: { $ref: "#/components/schemas/CostDriverItem" },
            roles: { $ref: "#/components/schemas/CostDriverItem" },
            users: { type: "integer", minimum: 0, description: "Concurrent users" },
            languages: { type: "integer", minimum: 1, description: "Number of programming languages" },
            factors: {
              type: "object",
              additionalProperties: { type: "number", minimum: 0, maximum: 5 },
              description: "VAF factor overrides (key: factor name, value: 0–5)",
            },
            teamSize: { type: "integer", minimum: 1 },
            currency: { type: "string", description: "ISO 4217 currency code, e.g. EUR" },
            profileId: { type: "string", format: "uuid", description: "Calibration profile to use (omit for active default)" },
          },
        },
        PhaseResult: {
          type: "object",
          required: ["name", "share", "effortPD"],
          properties: {
            name: { type: "string" },
            share: { type: "number" },
            effortPD: { type: "number" },
          },
        },
        RoleResult: {
          type: "object",
          required: ["name", "share", "effortPD", "dailyRate", "cost"],
          properties: {
            name: { type: "string" },
            share: { type: "number" },
            effortPD: { type: "number" },
            dailyRate: { type: "number" },
            cost: { type: "number" },
          },
        },
        EstimationResult: {
          type: "object",
          required: ["engineVersion", "profileId", "profileVersion", "rawFP", "vaf", "adjustedFP", "scaleFactor", "effortPD", "totalCost", "duration", "phases", "roles", "dimensions", "currency"],
          properties: {
            engineVersion: { type: "string" },
            profileId: { type: "string" },
            profileVersion: { type: "integer" },
            rawFP: { type: "number" },
            vaf: { type: "number" },
            adjustedFP: { type: "number" },
            scaleFactor: { type: "number" },
            effortPD: { $ref: "#/components/schemas/Band" },
            totalCost: { $ref: "#/components/schemas/Band" },
            duration: {
              type: "object",
              required: ["nominalMonths", "durationMonths"],
              properties: {
                capacityMonths: { type: "number" },
                nominalMonths: { type: "number" },
                durationMonths: { type: "number" },
              },
            },
            phases: { type: "array", items: { $ref: "#/components/schemas/PhaseResult" } },
            roles: { type: "array", items: { $ref: "#/components/schemas/RoleResult" } },
            dimensions: {
              type: "object",
              required: ["functionality", "integration", "complexity", "scalability"],
              properties: {
                functionality: { type: "number" },
                integration: { type: "number" },
                complexity: { type: "number" },
                scalability: { type: "number" },
              },
            },
            currency: { type: "string" },
          },
        },
        Profile: {
          type: "object",
          required: ["id", "name", "version", "isActive"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            version: { type: "integer" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            issues: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    paths: {
      "/estimate": {
        post: {
          summary: "Stateless estimation (no persistence)",
          operationId: "postEstimate",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/EstimationInput" } } },
          },
          responses: {
            "200": {
              description: "Estimation result",
              content: { "application/json": { schema: { $ref: "#/components/schemas/EstimationResult" } } },
            },
            "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
            "422": { description: "No active profile found" },
          },
        },
      },
      "/profiles": {
        get: {
          summary: "List calibration profiles",
          operationId: "getProfiles",
          responses: {
            "200": {
              description: "List of profiles",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Profile" } } } },
            },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/estimations/{id}": {
        get: {
          summary: "Get a saved estimation",
          operationId: "getEstimation",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            "200": {
              description: "Saved estimation",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "401": { description: "Unauthorized" },
            "404": { description: "Not found" },
          },
        },
      },
      "/estimations/{id}/export": {
        get: {
          summary: "Export estimation as PDF or XLSX",
          operationId: "exportEstimation",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            { name: "format", in: "query", schema: { type: "string", enum: ["pdf", "xlsx"], default: "pdf" } },
          ],
          responses: {
            "200": {
              description: "File download",
              content: {
                "application/pdf": { schema: { type: "string", format: "binary" } },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { schema: { type: "string", format: "binary" } },
              },
            },
            "401": { description: "Unauthorized" },
            "404": { description: "Not found" },
          },
        },
      },
    },
  };

  return Response.json(spec, {
    headers: { "Content-Type": "application/json" },
  });
}
