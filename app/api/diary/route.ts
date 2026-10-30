import {getDb} from '../../../db/index';
import {diary} from '../../../db/schema';
import {and,eq} from 'drizzle-orm';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const rows=await getDb().select().from(diary);return reply(Object.fromEntries(rows.map(r=>[r.date,{...JSON.parse(r.data),version:r.version}])));}catch{return reply({error:'기록을 불러올 수 없습니다.'},500);}}
export async function PUT(req:Request){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'허용되지 않은 요청입니다.'},403);
 const b=await req.json() as any;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date))||!Array.isArray(b.tasks)||b.tasks.length>100||!Number.isInteger(b.version)||b.version<0||typeof b.review!=='string'||b.review.length>5000||typeof b.next!=='string'||b.next.length>5000||typeof b.mood!=='string'||b.mood.length>30)return reply({error:'입력을 확인해 주세요.'},400);
 const seen=new Set();for(const t of b.tasks){if(typeof t.id!=='string'||t.id.length>100||seen.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>200||!['일 / 공부','건강','일상','나를 위한 시간'].includes(t.category)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time)||!Number.isInteger(t.planned)||t.planned<1||t.planned>1440||!Number.isInteger(t.actual)||t.actual<0||t.actual>1440||typeof t.done!=='boolean'||typeof t.note!=='string'||t.note.length>5000)return reply({error:'계획 입력을 확인해 주세요.'},400);seen.add(t.id);}
 const data={tasks:b.tasks.map((t:any)=>({id:t.id,title:t.title.trim(),category:t.category,time:t.time,planned:t.planned,actual:t.actual,done:t.done,note:t.note})),review:b.review,next:b.next,mood:b.mood};
 const db=getDb(),version=b.version+1;
 if(b.version===0){const rows=await db.insert(diary).values({date:b.date,data:JSON.stringify(data),version}).onConflictDoNothing().returning();if(!rows.length)return reply({error:'기록이 변경되었습니다.'},409);}
 else{const rows=await db.update(diary).set({data:JSON.stringify(data),version}).where(and(eq(diary.date,b.date),eq(diary.version,b.version))).returning();if(!rows.length)return reply({error:'기록이 변경되었습니다.'},409);}
 return reply({...data,version});
 }catch{return reply({error:'기록을 저장할 수 없습니다.'},500);}}
