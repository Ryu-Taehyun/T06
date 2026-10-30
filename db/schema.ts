import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const diary=sqliteTable('diary',{date:text('date').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(1)});
