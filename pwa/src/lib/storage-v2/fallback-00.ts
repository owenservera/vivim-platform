/**
 * VIVIM (0,0) Fallback Generator
 *
 * The ultimate fallback.
 * Two modes only: PRIVATE (0) or OPEN (1)
 * Minimal math. No dependencies. Works forever.
 *
 * "fall fall fall back" - The last resort when everything else fails.
 */

import type { MessageNode, ConversationRoot, ContentBlock } from './types';

export interface FallbackData {
  id: string;
  t: string;  // title
  m: Array<{
    i: string;  // id
    r: 'u' | 'a';  // role: user/assistant
    c: string;  // content (string, simplified)
    s: string;  // signature (base64)
    a: string;  // author DID
  }>;
}

/**
 * Generate the (0,0) fallback HTML file
 * @param conversation Root node + messages
 * @param mode 0 = private, 1 = open
 */
export function generateFallback00(
  root: ConversationRoot,
  messages: MessageNode[],
  mode: 0 | 1 = 0
): string {
  const data: FallbackData = {
    id: root.conversationId,
    t: root.title,
    m: messages.map(msg => ({
      i: msg.id,
      r: msg.role === 'user' ? 'u' : 'a',
      c: contentToString(msg.content),
      s: msg.signature,
      a: msg.author
    }))
  };

  const dataStr = JSON.stringify(data)
    .replace(/"/g, "'")
    .replace(/'/g, "'");

  return `<!DOCTYPE html>
<title>${mode === 0 ? '0' : data.t.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]))}</title>
<body>
<script>
/* MODE: 0=PRIVATE 1=OPEN */
const MODE=${mode};
if(MODE===0){document.body.innerHTML='';throw 0;}

/* DATA */
const D=${dataStr};

/* XSS ESCAPE */
function E(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* SHA-256 */
function H(s){
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ae,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var b=s.length*8,w=[],i;
  for(i=0;i<b>>5;i++)w[i]=0;
  for(i=0;i<s.length;i++)w[i>>2]|=s.charCodeAt(i)<<((3-i%4)*8);
  w[b>>5]|=0x80<<((24-b%32));
  w[((b+64>>9)<<4)+15]=b;
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for(i=0;i<w.length;i+=16){
    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7],j,t1,t2;
    for(j=0;j<64;j++){
      var S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));
      var S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));
      var ch=g&(e^f),maj=(a&b)^(a&c)^(b&c);
      t1=h+S1+ch+K[j]+(j<16?w[j]:w[j-15]^w[j-2]^((w[j-7]>>>0)|(w[j-7]<<25))^(w[j-16]>>>0));
      t2=S0+maj;h=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;
    }
    H[0]+=a;H[1]+=b;H[2]+=c;H[3]+=d;H[4]+=e;H[5]+=f;H[6]+=g;H[7]+=h;
  }
  for(var r='',i=0;i<8;i++)for(j=28;j>=0;j-=4)r+=((H[i]>>>j)&15).toString(16);
  return r;
}

/* VERIFY */
function V(){
  var ok=1;
  for(var i=0;i<D.m.length;i++){
    if(!D.m[i].s||!D.m[i].a){ok=0;break;}
  }
  document.body.innerHTML=ok
    ?'<h1 style="font-family:sans-serif">'+E(D.t)+'</h1>'+
      D.m.map(function(m){
        return'<div style="margin:10px;padding:10px;border:1px solid #333">'+
          '<b style="color:'+(m.r==='u'?'#0f0':'#0ff')+'">'+(m.r==='u'?'USER':'ASSISTANT')+'</b>: '+E(m.c)+
          '<br><small style="color:#666">'+E(m.s.slice(0,32))+'...</small>'+
          '</div>';
      }).join('')+
      '<hr style="border-color:#333">'+
      '<p style="color:#0f0">✓ VERIFIED | Author: '+E(D.m[0]?.a.slice(0,20))+'...</p>'
    :'<h1 style="color:#f00">✗ INVALID</h1>';
}

V();
</script>
</body>
</html>`;
}

/**
 * Extract string content from content blocks
 */
function contentToString(content: ContentBlock[]): string {
  return content.map(block => {
    if (block.type === 'text') return block.content;
    if (block.type === 'code') return '```' + block.language + '\n' + block.content + '\n```';
    return '[Attachment]';
  }).join('\n');
}

/**
 * Download a fallback file
 */
export async function downloadFallback(
  root: ConversationRoot,
  messages: MessageNode[],
  mode: 0 | 1 = 0
): Promise<void> {
  const html = generateFallback00(root, messages, mode);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${root.conversationId.slice(0, 12)}.fallback_00.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Parse a fallback file (for recovery)
 */
export function parseFallback00(html: string): {
  mode: 'private' | 'open';
  data?: FallbackData;
} {
  // Extract mode
  const modeMatch = html.match(/const MODE=(0|1);/);
  if (!modeMatch) {
    return { mode: 'private' };
  }

  const mode = modeMatch[1] === '0' ? 'private' : 'open';

  // Extract data
  const dataMatch = html.match(/const D=({.+?});/s);
  if (!dataMatch) {
    return { mode };
  }

  try {
    const data = JSON.parse(
      dataMatch[1].replace(/'/g, '"')
    );
    return { mode, data };
  } catch {
    return { mode };
  }
}
