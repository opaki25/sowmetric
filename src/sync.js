const KEY='sowmetric.pending';
function pending(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
let syncing=false;
export function enqueue(record){const queue=pending();if(!queue.some(r=>r.id===record.id))localStorage.setItem(KEY,JSON.stringify([...queue,record]));void synchronize();}
export async function synchronize(){if(syncing)return;syncing=true;try{for(const record of pending()){let response;try{response=await fetch('/api/transactions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)})}catch{break}if(!response.ok)break;localStorage.setItem(KEY,JSON.stringify(pending().filter(r=>r.id!==record.id)))}}finally{syncing=false}}
window.addEventListener('online',synchronize);setInterval(synchronize,30000);void synchronize();
