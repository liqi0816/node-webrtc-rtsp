import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as koaStatic from 'koa-static';
import * as KoaRouter from 'koa-router';
import { ServerRTCPeerConnection } from './peer.js';

const connections = new Map<string, ServerRTCPeerConnection>();
const router = new KoaRouter();

router.get('/*', koaStatic(`${__dirname}/../client`));
router.get('/client/*', koaStatic(`${__dirname}/..`));

const mapConnectionsDescription = function* mapConnectionsDescription(
    connections: Map<string, ServerRTCPeerConnection>
): IterableIterator<[string, ServerRTCPeerConnection['description']]> {
    for (const [id, { description }] of connections) {
        yield [id, description];
    }
}
router.get('/connections', (ctx, next) => {
    ctx.body = JSON.stringify(Object.fromEntries(mapConnectionsDescription(connections)));
    return next();
});

router.post('/connections', async (ctx, next) => {
    const id = await ServerRTCPeerConnection.genId(connections);
    const connection = new ServerRTCPeerConnection(id);
    connections.set(id, connection);
    await connection.initialize();
    connection.addEventListener('close', () => connections.delete(id));
    ctx.body = connection.description;
    return next();
});

router.delete('/connections/:id', (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    connection.close();
    ctx.body = connection.description;
    return next();
});

router.get('/connections/:id', (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    ctx.body = connection.description;
    return next();
});

router.post('/connections/:id/record', koaBody(), async (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    const { status } = ctx.request.body;
    if (typeof status !== 'string') {
        ctx.throw(400);
    }
    else if (status === 'started') {
        ctx.body = await connection.record();
    }
    else if (status === 'stopped') {
        ctx.body = await connection.stopRecord();
    }
    return next();
});

router.get('/connections/:id/record', (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    ctx.throw(501);
    return next();
});

router.get('/connections/:id/local-description', (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    ctx.body = connection.localDescription;
    return next();
});

router.get('/connections/:id/remote-description', (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    ctx.body = connection.remoteDescription;
    return next();
});

router.post('/connections/:id/remote-description', koaBody(), async (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    await connection.respond(ctx.request.body);
    ctx.body = connection.remoteDescription;
    return next();
});

const app = new Koa();
app.use(router.routes());
app.use(router.allowedMethods());
if (!module.parent) app.listen(80);
