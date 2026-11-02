// Diagnóstico de ejecución única. Sin servidor HTTP, secretos ni reintentos.
// No ejecuta una consulta si no se reconoce el entorno Render.
import { pathToFileURL } from 'node:url';
export async function probe({env=process.env,fetchImpl=fetch}={}) {
  if(env.RENDER!=='true') throw new Error('RENDER_ENV_REQUIRED');
  const start=Date.now(), controller=new AbortController(); let ownAbort=false;
  const timer=setTimeout(()=>{ownAbort=true;controller.abort();},30000);
  const result={execution_platform:'Render (environment asserted)',region:env.RENDER_REGION||null,cui:'2041604',source:'https://ofi5.mef.gob.pe/invierteWS/Ssi/traeDetInvSSI',started_at:new Date(start).toISOString(),timeout_ms:30000};
  try {
    const response=await fetchImpl(result.source,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:'id=2041604&tipo=SIAF',redirect:'manual',signal:controller.signal});
    result.http=response.status; result.headers_latency_ms=Date.now()-start;
    result.response_headers={};
    for(const name of ['cf-error-type','cf-error-origin','cf-ray','server','date','content-type']){const value=response.headers.get(name);if(value)result.response_headers[name]=value.slice(0,512);}
    await response.body?.cancel(); result.body_read=false;
  } catch(error) {result.error_name=error.name;result.error_message=String(error.message).slice(0,250);}
  finally {clearTimeout(timer);result.aborted_by_own_timeout=ownAbort;result.elapsed_ms=Date.now()-start;result.finished_at=new Date().toISOString();}
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await probe(),null,2));
