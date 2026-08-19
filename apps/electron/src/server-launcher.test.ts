import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForServer } from './server-launcher';

test('服务探测成功时立即返回', async () => {
    const ready = await waitForServer(14000, 0, async () => true, 0);
    assert.equal(ready, true);
});

test('服务在超时时间内未就绪时返回失败', async () => {
    const ready = await waitForServer(14000, 0, async () => false, 0);
    assert.equal(ready, false);
});
