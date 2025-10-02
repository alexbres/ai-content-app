import type { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

type Segment = 'query' | 'params' | 'body'

export function validate(schema: Joi.ObjectSchema, segment: Segment = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate((req as any)[segment], { abortEarly: false, stripUnknown: true, convert: true })
    if (error) {
      return res.status(400).json({ error: 'ValidationError', details: error.details.map((d) => d.message) })
    }
    ;(req as any)[segment] = value
    next()
  }
}


