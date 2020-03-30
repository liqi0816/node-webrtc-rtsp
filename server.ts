import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as KoaRouter from 'koa-router';

import WebRtcConnectionManager from './lib/webrtcconnectionmanager.js';

const manager = new WebRtcConnectionManager();
const router = new KoaRouter();

router.use(koaBody());

router.get('connections', (ctx, next) => {
    ctx.body = manager.connections;
    return next();
});

router.post('connections', async (ctx, next) => {
    ctx.body = await manager.initiateConnection();
    return next();
});

router.delete('connections/:id', (ctx, next) => {
    const { id } = ctx.params;
    const connection = manager.connections[id];
    if (!connection) return ctx.throw(404);
    connection.close();
    ctx.body = connection;
    return next();
});

router.get('connections/:id', (ctx, next) => {
    const { id } = ctx.params;
    const connection = manager.connections[id];
    if (!connection) return ctx.throw(404);
    ctx.body = connection;
    return next();
});

router.get('connections/:id/local-description', (ctx, next) => {
    const { id } = ctx.params;
    const connection = manager.connections[id];
    if (!connection) return ctx.throw(404);
    ctx.body = connection.localDescription;
    return next();
});

router.get('connections/:id/remote-description', (ctx, next) => {
    const { id } = ctx.params;
    const connection = manager.connections[id];
    if (!connection) return ctx.throw(404);
    ctx.body = connection.remoteDescription;
    return next();
});

router.post('connections/:id/remote-description', async (ctx, next) => {
    const { id } = ctx.params;
    const connection = manager.connections[id];
    if (!connection) return ctx.throw(404);
    await connection.applyAnswer(ctx.request.body);
    ctx.body = connection.remoteDescription;
    return next();
});

const app = new Koa();
app.use(router.routes());
if (!module.parent) app.listen(80);
