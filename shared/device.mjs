/** Device contract: command(name, payload), snapshot(), subscribe(listener), disconnect(). */
export class SimulatorDevice {
 constructor({capacity=5,maxBatch=4,tolerance=.01}={}) {if(maxBatch>=capacity||maxBatch<=0)throw Error('Unsafe batch capacity');this.config={capacity,maxBatch,tolerance};this.listeners=new Set();this.data={state:'READY',weight:0,target:0,motor:false,gate:false,container:true,connected:true,calibrated:true,seedAvailable:true};}
 snapshot(){return {...this.data,mode:'simulation'}}
 subscribe(fn){this.listeners.add(fn);fn(this.snapshot());return()=>this.listeners.delete(fn)}
 emit(){for(const fn of this.listeners)fn(this.snapshot())}
 halt(state){this.data.state=state;this.data.motor=false;this.data.gate=false;this.emit();return this.snapshot()}
 command(name,p={}){const d=this.data;if(name==='GET_STATUS'||name==='READ_WEIGHT'||name==='GET_SENSOR_DATA')return this.snapshot();if(name==='STOP_DISPENSING')return this.halt('STOPPED');if(name==='EMERGENCY_STOP')return this.halt('EMERGENCY_STOP');if(name==='RESET'){if(d.motor)throw Error('Stop before reset');d.weight=0;return this.halt('READY')}
 if(!d.connected||!d.container||!d.calibrated||!d.seedAvailable)throw Error('Device readiness check failed');
 if(name==='TARE'){if(d.motor)throw Error('Cannot tare while running');d.weight=0;return this.halt('READY')}
 if(name==='START_DISPENSING'){if(d.state!=='READY'||!Number.isFinite(p.target)||p.target<=0||p.target>this.config.maxBatch)throw Error('Invalid start');d.target=p.target;d.state='TARING';this.emit();return this.snapshot()}
 if(name==='PAUSE_DISPENSING'){if(d.state!=='DISPENSING')throw Error('Not dispensing');return this.halt('PAUSED')}
 if(name==='RESUME_DISPENSING'){if(d.state!=='PAUSED')throw Error('Not paused');d.state='DISPENSING';d.motor=d.gate=true;this.emit();return this.snapshot()}throw Error('Unsupported command')}
 tick(seconds=.1){const d=this.data;if(!Number.isFinite(seconds)||seconds<=0)throw Error('Invalid elapsed time');if(d.state==='TARING'){d.weight=0;d.state='DISPENSING';d.motor=d.gate=true}else if(d.state==='DISPENSING'){d.weight=Math.min(d.target,d.weight+Math.max(.02,(d.target-d.weight)*.8)*seconds);if(d.weight>=d.target)return this.halt('SETTLING')}else if(d.state==='SETTLING')return this.halt('COMPLETED');this.emit();return this.snapshot()}
 fault(reason){this.data.error=reason;return this.halt('ERROR')}
 disconnect(){this.data.connected=false;return this.fault('Disconnected')}
}
/** Transport must provide write(line), onLine(fn), onDisconnect(fn). No automatic motor starts. */
export class HardwareDevice {
 constructor(transport,{timeout=2000,authorized=false}={}){this.transport=transport;this.timeout=timeout;this.authorized=authorized;this.pending=new Map();this.listeners=new Set();this.data={state:'DISCONNECTED',mode:'hardware'};transport.onLine(line=>this.receive(line));transport.onDisconnect(()=>this.disconnect());}
 snapshot(){return {...this.data}}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 receive(line){let m;try{m=JSON.parse(line)}catch{return}if(m.protocolVersion!==1)return;if(m.type==='telemetry'){if(!Number.isFinite(m.weightKg)||m.weightKg<0){this.data={...this.data,state:'ERROR',error:'Invalid scale reading'};}else this.data={...m,mode:'hardware'};for(const f of this.listeners)f(this.snapshot())}if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);clearTimeout(p.timer);this.pending.delete(m.id);m.ok?p.resolve(m):p.reject(Error(m.error||'Device rejected command'))}}
 command(command,payload={}){if(['START_DISPENSING','RESUME_DISPENSING','TARE'].includes(command)&&!this.authorized)return Promise.reject(Error('Operator authorization required'));const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Device acknowledgement timed out; inspect controller before retrying'))},this.timeout);this.pending.set(id,{resolve,reject,timer});try{this.transport.write(JSON.stringify({protocolVersion:1,id,command,payload})+'\n')}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e)}})}
 disconnect(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('Controller disconnected'))}this.pending.clear();this.data={state:'DISCONNECTED',mode:'hardware'};for(const f of this.listeners)f(this.snapshot())}
}
