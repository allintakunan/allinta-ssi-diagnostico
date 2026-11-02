// Diagnóstico de ejecución única. Sin servidor HTTP, secretos ni reintentos.
// No ejecuta una consulta si no se reconoce el entorno Render.
import { pathToFileURL } from 'node:url';
const errorNames=new Set(['Error','TypeError','AggregateError','AbortError','TimeoutError','ConnectTimeoutError','HeadersTimeoutError','BodyTimeoutError','SocketError','UndiciError']);
const errorCodes=new Set(['UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','UND_ERR_SOCKET','UND_ERR_ABORTED','ETIMEDOUT','ECONNREFUSED','ECONNRESET','ENOTFOUND','EAI_AGAIN','ENETUNREACH','EHOSTUNREACH','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','DEPTH_ZERO_SELF_SIGNED_CERT','ERR_TLS_CERT_ALTNAME_INVALID']);
export function safeErrorChain(error){
  const chain=[],seen=new Set();
  function visit(value,depth){if(!value||typeof value!=='object'||seen.has(value)||depth>4||chain.length>=12)return;seen.add(value);chain.push({depth,name:errorNames.has(value.name)?value.name:'OTHER',code:errorCodes.has(value.code)?value.code:null});visit(value.cause,depth+1);if(Array.isArray(value.errors))for(const child of value.errors.slice(0,4))visit(child,depth+1);}
  visit(error,0);return chain;
}
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
  } catch(error) {result.error_chain=safeErrorChain(error);}
  finally {clearTimeout(timer);result.aborted_by_own_timeout=ownAbort;result.elapsed_ms=Date.now()-start;result.finished_at=new Date().toISOString();}
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await probe(),null,2));
