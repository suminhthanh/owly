import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { parseJsonResponse } from "../helpers/request";

const mockPrisma = prisma as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return ok status when database is connected", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
    expect(data.version).toBe("0.1.0");
    expect(data.uptime).toBeDefined();
  });

  it("should return degraded status when database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.status).toBe("degraded");
    expect(data.database).toBe("error");
  });
});
