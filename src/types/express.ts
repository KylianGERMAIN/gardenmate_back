import { Request } from 'express';

export type RequestWithParams<TParams> = Request & {
  params: TParams;
};

export type RequestWithBody<TBody> = Request & {
  body: TBody;
};

export type RequestWithQuery<TQuery> = Request & {
  query: TQuery;
};
