import { applyMergePatch } from '../mergePatch';

describe('applyMergePatch (RFC 7386)', () => {
  it('merges a nested object without dropping sibling keys', () => {
    const target = { guestPortal: { walledGardens: [], maxDevices: 1 }, name: 'wlan' };
    const patch = { guestPortal: { walledGardens: ['a.com'] } };
    const result = applyMergePatch(target, patch);
    expect(result).toEqual({
      guestPortal: { walledGardens: ['a.com'], maxDevices: 1 },
      name: 'wlan',
    });
  });

  it('replaces arrays wholesale (no element merge)', () => {
    const target = { walledGardens: ['a.com', 'b.com'] };
    const patch = { walledGardens: ['c.com'] };
    expect(applyMergePatch(target, patch)).toEqual({ walledGardens: ['c.com'] });
  });

  it('deletes a key when the patch value is null', () => {
    const target = { a: 1, b: 2 };
    const patch = { b: null };
    expect(applyMergePatch(target, patch)).toEqual({ a: 1 });
  });

  it('replaces scalars', () => {
    expect(applyMergePatch({ vlanId: 1 }, { vlanId: 7 })).toEqual({ vlanId: 7 });
  });

  it('adds new nested keys', () => {
    const target = { wlan: { ssid: 'X' } };
    const patch = { wlan: { vlanId: 5 }, enabled: true };
    expect(applyMergePatch(target, patch)).toEqual({
      wlan: { ssid: 'X', vlanId: 5 },
      enabled: true,
    });
  });

  it('treats a non-object target as empty when the patch is an object', () => {
    expect(applyMergePatch(null, { a: 1 })).toEqual({ a: 1 });
    expect(applyMergePatch(5, { a: 1 })).toEqual({ a: 1 });
  });

  it('returns the patch when the patch is not a plain object', () => {
    expect(applyMergePatch({ a: 1 }, ['x'])).toEqual(['x']);
    expect(applyMergePatch({ a: 1 }, 'scalar')).toBe('scalar');
  });

  it('does not mutate the inputs', () => {
    const target = { guestPortal: { walledGardens: ['a.com'] } };
    const patch = { guestPortal: { walledGardens: ['b.com'] } };
    const targetCopy = JSON.parse(JSON.stringify(target));
    const patchCopy = JSON.parse(JSON.stringify(patch));
    const result = applyMergePatch(target, patch);
    expect(target).toEqual(targetCopy);
    expect(patch).toEqual(patchCopy);
    // result is independent: mutating it must not affect the patch
    result.guestPortal.walledGardens.push('c.com');
    expect(patch.guestPortal.walledGardens).toEqual(['b.com']);
  });

  it('handles deep nesting (config-like shape)', () => {
    const target = {
      wlan: { advancedCustomization: { maxClientsOnWlanPerRadio: 100, hideSsid: false } },
      guestPortal: { walledGardens: [] },
    };
    const patch = { wlan: { advancedCustomization: { hideSsid: true } } };
    expect(applyMergePatch(target, patch)).toEqual({
      wlan: { advancedCustomization: { maxClientsOnWlanPerRadio: 100, hideSsid: true } },
      guestPortal: { walledGardens: [] },
    });
  });
});
