import { db, syncFromSupabase } from './src/lib/store';
async function test() {
    await syncFromSupabase(true);
    console.log(db.getExams());
}
test();
