/** RFC 9457 problem+json shape the backend returns for every error. */
export interface ProblemBody {
  type?: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: { field: string; message: string }[];

  constructor(status: number, code: string, message: string, fieldErrors?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as Partial<ProblemBody>;
    return new ApiError(res.status, body.code ?? "ERROR", body.title ?? body.detail ?? "Request failed", body.errors);
  } catch {
    return new ApiError(res.status, "ERROR", res.statusText || "Request failed");
  }
}
