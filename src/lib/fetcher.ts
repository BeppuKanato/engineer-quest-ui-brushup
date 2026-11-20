import { isDesignMode, resolveFixture } from "@/design/fixtures";
import { getApiBaseUrl } from "@/lib/api";

export type ApiErrorResponse = {
  message: string;
  code: string;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type FetcherOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: HeadersInit;
};

const parseErrorResponse = async (
  response: Response
): Promise<ApiErrorResponse> => {
  const fallbackError: ApiErrorResponse = {
    message: "API request failed",
    code: "UNKNOWN_ERROR",
  };

  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;

    return {
      message: body.message ?? fallbackError.message,
      code: body.code ?? fallbackError.code,
    };
  } catch {
    return fallbackError;
  }
};

export const fetcher = async <T>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
    // デザインモード：API を呼ばず、src/design/fixtures.ts のフィクスチャを返す。
    if (isDesignMode()) {
        const fixture = resolveFixture(path);
        if (fixture !== undefined) {
            return structuredClone(fixture) as T;
        }
        const method = (options.method ?? "GET").toUpperCase();
        if (method !== "GET") {
            return {} as T;
        }
        throw new ApiError(
            404,
            "DESIGN_FIXTURE_MISSING",
            `デザインモード: ${path} のフィクスチャはまだ用意されていません`
        );
    }

    const baseUrl = getApiBaseUrl();
    const { token, headers, ...requestOptions } = options;

    const response = await fetch(`${baseUrl}${path}`, {
        ...requestOptions,
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const errorBody = await parseErrorResponse(response);

        throw new ApiError(response.status, errorBody.code, errorBody.message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
};
