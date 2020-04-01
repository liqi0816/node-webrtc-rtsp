import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as KoaRouter from 'koa-router';
import { MyRTCPeerConnection } from './webrtc.js';

const connections = new Map<string, MyRTCPeerConnection>();
const router = new KoaRouter();

router.use(koaBody());

router.get('/connections', (ctx, next) => {
    ctx.body = Object.fromEntries([...connections.entries()]);
    return next();
});

router.post('/connections', async (ctx, next) => {
    {
        let id: string;
        do {
            id = await MyRTCPeerConnection.genId();
        } while (connections.has(id));
        const connection = new MyRTCPeerConnection(id);
        connections.set(id, connection);
        await connection.initialize();
        connection.addEventListener('close', () => connections.delete(id));
        ctx.body = connection.description;
    }
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

router.post('/connections/:id/remote-description', async (ctx, next) => {
    const { id } = ctx.params;
    const connection = connections.get(id);
    if (!connection) return ctx.throw(404);
    await connection.respond(ctx.request.body);
    ctx.body = connection.remoteDescription;
    return next();
});

const app = new Koa();
app.use(router.routes());
if (!module.parent) app.listen(80);
