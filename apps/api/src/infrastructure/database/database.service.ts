import { Injectable } from '@nestjs/common';
import { db } from '../../db';

/** Temporary application facade while the legacy persistence class is split by domain. */
@Injectable()
export class DatabaseService {
  readonly database = db;
}
