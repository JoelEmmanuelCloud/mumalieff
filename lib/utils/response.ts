import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export const successResponse = <T = any>(data: T, message?: string, status: number = 200) => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    } as ApiResponse<T>,
    { status }
  );
};

export const errorResponse = (error: string | Error, status: number = 500, errors?: any[]) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      errors,
    } as ApiResponse,
    { status }
  );
};

export const validationErrorResponse = (errors: any[], message: string = 'Validation failed') => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
    } as ApiResponse,
    { status: 400 }
  );
};

export const unauthorizedResponse = (message: string = 'Unauthorized access') => {
  return errorResponse(message, 401);
};

export const forbiddenResponse = (message: string = 'Access forbidden') => {
  return errorResponse(message, 403);
};

export const notFoundResponse = (message: string = 'Resource not found') => {
  return errorResponse(message, 404);
};
