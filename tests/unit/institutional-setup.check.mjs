import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
const script = new URL(
  '../../scripts/setup-institutional-projects.mjs',
  import.meta.url,
).href;
function run(preserve = false, incompatible = false) {
  const driver = `const calls=[]; globalThis.fetch=async(url,options)=>{const {query,variables:v}=JSON.parse(options.body);calls.push({query,variables:v});let data;
if(query.includes('metaobjectDefinitionByType')) data={metaobjectDefinitionByType:v.type==='ciseco--route'?{id:'route-definition',access:{storefront:'PUBLIC_READ'},capabilities:{publishable:{enabled:true}},fieldDefinitions:[{key:'sections',type:{name:${JSON.stringify(incompatible ? 'list.metaobject_reference' : 'list.mixed_reference')}},validations:[{name:'metaobject_definition_ids',value:'["old-section"]'},{name:'list.max',value:'20'}]}]}:null};
else if(query.includes('metaobjectDefinitionCreate')) data={metaobjectDefinitionCreate:{metaobjectDefinition:{id:v.definition.type},userErrors:[]}};
else if(query.includes('metaobjectDefinitionUpdate')) data={metaobjectDefinitionUpdate:{metaobjectDefinition:{id:'route-definition'},userErrors:[]}};
else if(query.includes('metaobjectByHandle')) data={metaobjectByHandle:${preserve ? 'true' : 'false'}?{id:v.handle.handle}:null};
else if(query.includes('metaobjectCreate')) data={metaobjectCreate:{metaobject:{id:v.metaobject.handle},userErrors:[]}};
else throw Error('Unexpected operation'); return {ok:true,json:async()=>({data})};};
try{await import(${JSON.stringify(script)});console.log('RESULT:'+JSON.stringify({calls}));}catch(e){console.log('RESULT:'+JSON.stringify({error:e.message,calls}));}`;
  const output = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', driver],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        SHOPIFY_STORE_DOMAIN: 'test.myshopify.com',
        SHOPIFY_ADMIN_TOKEN: 'test-only',
      },
    },
  );
  return JSON.parse(output.split('RESULT:')[1]);
}
test('setup appends the institutional definition without losing builder validations', () => {
  const {calls, error} = run();
  assert.equal(error, undefined);
  const update = calls.find((c) =>
    c.query.includes('metaobjectDefinitionUpdate'),
  );
  const validations =
    update.variables.definition.fieldDefinitions[0].update.validations;
  assert.deepEqual(
    JSON.parse(
      validations.find((v) => v.name === 'metaobject_definition_ids').value,
    ),
    ['old-section', 'ciseco--section_institutional'],
  );
  assert.deepEqual(
    validations.find((v) => v.name === 'list.max'),
    {name: 'list.max', value: '20'},
  );
  const route = calls.find(
    (c) => c.variables.metaobject?.type === 'ciseco--route',
  );
  assert.equal(
    route.variables.metaobject.capabilities.publishable.status,
    'ACTIVE',
  );
  assert.equal(
    JSON.parse(
      route.variables.metaobject.fields.find((f) => f.key === 'sections').value,
    ).length,
    10,
  );
});
test('existing content entries are preserved on repeat setup', () => {
  const {calls, error} = run(true);
  assert.equal(error, undefined);
  assert.equal(
    calls.filter((c) => c.query.includes('metaobjectCreate(')).length,
    0,
  );
});
test('incompatible builder stops before any write', () => {
  const {calls, error} = run(false, true);
  assert.ok(error.includes('No se encontró el builder'));
  assert.ok(calls.every((c) => !c.query.includes('mutation')));
});
