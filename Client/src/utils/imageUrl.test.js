import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageUrl as clientResolve } from './imageUrl.js';
import { resolveImageUrl as adminResolve } from '../../../Admin/src/utils/imageUrl.js';

const page = 'https://store.example/products/sample';
for (const [app, resolve] of [['Client', clientResolve], ['Admin', adminResolve]]) {
  test(`${app}: switching to a legacy local variant image uses deployed uploads`, () => {
    for (const host of ['localhost:5000', '127.0.0.1:5000', '192.168.1.4', '172.16.1.1', '[::1]:5000', '[fd00::1]']) {
      assert.equal(resolve(`http://${host}/uploads/red.jpg?v=2`, '', page), '/uploads/red.jpg?v=2');
      assert.equal(resolve(`http://${host}/private`, '', page), '');
    }
    assert.equal(resolve('//localhost:5000/uploads/red.jpg', '', page), '/uploads/red.jpg');
    assert.equal(resolve('/uploads/red.jpg', 'http://localhost:5000', page), '/uploads/red.jpg');
    assert.equal(resolve('uploads/red.jpg', '', page), '/uploads/red.jpg');
  });

  test(`${app}: deployed asset servers, CDN images, previews, and local development still work`, () => {
    assert.equal(resolve('http://localhost:5000/uploads/red.jpg', 'https://api.example', page), 'https://api.example/uploads/red.jpg');
    assert.equal(resolve('https://cdn.example/red.jpg', '', page), 'https://cdn.example/red.jpg');
    assert.equal(resolve('data:image/png;base64,AAA', '', page), 'data:image/png;base64,AAA');
    assert.equal(resolve('blob:https://store.example/image', '', page), 'blob:https://store.example/image');
    assert.equal(resolve('/uploads/red.jpg', 'http://localhost:5000', 'http://localhost:5173'), 'http://localhost:5000/uploads/red.jpg');
  });
}
