"use strict";
!(function () {
  try {
    var e =
        "undefined" != typeof window
          ? window
          : "undefined" != typeof global
            ? global
            : "undefined" != typeof globalThis
              ? globalThis
              : "undefined" != typeof self
                ? self
                : {},
      n = new e.Error().stack;
    n &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[n] = "9c81c427-7bea-4c62-a245-c5f66ab2bb10"),
      (e._sentryDebugIdIdentifier =
        "sentry-dbid-9c81c427-7bea-4c62-a245-c5f66ab2bb10"));
  } catch (e) {}
})();
("use strict");
var Z = require("electron");
var Qn = ["ready", "failed", "stuck", "aborted"];
var gs = 1048576,
  Es = 1024e3,
  As = 1e4,
  Rs = 1.1,
  Ts = 1.25;
function hs(e) {
  let n = (s) =>
      typeof s == "number" && Number.isInteger(s) && s >= 0 && s <= e,
    r = (s) => (n(s) ? s : void 0),
    a = (s) => {
      let y = Math.min(Math.max(Math.round(s), 0), e);
      return n(y) ? y : a(0);
    };
  return { parse: r, to: a };
}
function et(e, n) {
  let r = [0, 1],
    a = 1;
  for (;;) {
    let s = Math.max(a + 1, Math.round(a * e));
    if (s > n) return r;
    (r.push(s), (a = s));
  }
}
var Cs = et(Rs, gs),
  bs = et(Ts, Es);
function nt(e) {
  let n = new Set(e),
    r = (y) => typeof y == "number" && n.has(y),
    a = (y) => (r(y) ? y : void 0),
    s = (y) => {
      let C = e.findLast((h) => h <= y) ?? 0;
      return r(C) ? C : s(0);
    };
  return { parse: a, to: s };
}
var tt = nt(Cs),
  rt = nt(bs),
  ot = hs(As),
  Ip = tt.parse,
  Np = tt.to,
  Op = rt.parse,
  kp = rt.to,
  xp = ot.parse,
  Dp = ot.to;
var Up = { none: 0, equal: 1 / 2, full: 1 };
var it = "__duneReliability",
  ln = "dune:reliability-report";
function st(e, n) {
  let r = {
    report: (a) => {
      n.send(ln, a);
    },
  };
  e.exposeInMainWorld(it, r);
}
var Os = new Map([
  ["enabled", "enabled"],
  ["enabled_on", "enabled"],
  ["enabled_force", "enabled"],
  ["enabled_force_on", "enabled"],
  ["enabled_readback", "enabled"],
  ["disabled_software", "disabled_software"],
  ["unavailable_software", "disabled_software"],
]);
function dt(e) {
  let n = !1;
  return (
    e.once("gpu-info-update", () => {
      n = !0;
    }),
    () =>
      e.isHardwareAccelerationEnabled()
        ? n
          ? (Os.get(e.getGPUFeatureStatus().gpu_compositing) ?? "unknown")
          : "unknown"
        : "disabled_software"
  );
}
function B(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
var ks = 1024 * 1024,
  ky = ks / 2;
var xs = 864e5,
  aS = 30 * xs;
var iS = [...Qn, "pending"];
var IS = 256 * 1024;
var Ds = /^[a-z0-9]+-[0-9]+$/;
function lt(e) {
  return Ds.test(e);
}
var Ls = 2 ** 32;
function ct(e) {
  return Number.isInteger(e) && e >= 0 && e < Ls;
}
var cn = 2,
  ut = ["click", "keydown", "pointerdown", "wheel", "input"],
  pt = ["open", "close"],
  yt = ["overlay", "workspace", "shell"],
  St = [
    "button",
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "tab",
    "checkbox",
    "radio",
    "switch",
    "slider",
    "textbox",
    "searchbox",
    "combobox",
    "listbox",
    "treeitem",
    "gridcell",
    "row",
    "dialog",
    "alertdialog",
    "log",
    "region",
    "status",
  ],
  mt = ["immediate", "user-blocking", "normal", "idle"],
  ft = ["mount", "update"],
  _t = ["layout", "passive"],
  gt = ["view", "layout"],
  un = ["default", "transition"],
  pn = ["quiet", "cap", "superseded"],
  Et = ["presented", ...pn];
var At = "__duneRenderTraceSampleRate";
function Rt(e) {
  return typeof e == "number" && e > 0 && e <= 1;
}
var Tt = "--dune-render-trace-sample-rate=",
  Ms = Object.freeze({
    sampled: !1,
    sampleRate: 0,
    additionalArguments: Object.freeze([]),
  });
function ht(e) {
  let n = e.find((a) => a.startsWith(Tt));
  if (n === void 0) return null;
  let r = Number(n.slice(Tt.length));
  return Rt(r) ? r : null;
}
var ws = [
    "dune_session_id",
    "dune_app",
    "app_version",
    "app_built_at",
    "track",
    "platform",
    "arch",
    "gpu_compositing",
    "dune_install_id",
    "dune_row_id",
  ],
  em = new Set(["dune_signal", "dune_reason", ...ws]);
var Sm = BigInt(127),
  mm = BigInt(7),
  fm = new TextEncoder();
var Tm = BigInt(1e3);
var Us = Symbol("redirect"),
  Ct = class {
    constructor(n, r) {
      this.link = n;
      this.history = r;
    }
    link;
    history;
    [Us]() {
      return "redirect";
    }
  };
var bt = Object.freeze({
    workspace: Object.freeze({ idPrefix: "view" }),
    overlay: Object.freeze({ idPrefix: "overlay" }),
  }),
  bm = Object.freeze({ text: "", value: void 0 });
var H = (e) => typeof e == "string",
  yn = (e) => typeof e == "boolean",
  N = (e) => typeof e == "number" && Number.isFinite(e),
  P = (e) => typeof e == "number" && Number.isInteger(e) && e >= 0,
  It = (e) => typeof e == "string" && lt(e),
  Sn = (e) => typeof e == "number" && ct(e),
  Vs = (e) => e === cn,
  Ve = (e) => N(e) && e >= 0,
  Bs = (e) => N(e) && e > 0 && e <= 1;
function G(e) {
  let n = new Set(e);
  return (r) => typeof r == "string" && n.has(r);
}
function Nt(e) {
  return (n) => n === null || e(n);
}
function Be(e) {
  return (n) => Array.isArray(n) && n.every(e);
}
function Te(e, n, r = {}) {
  if (!B(e)) return !1;
  for (let a of Object.keys(e))
    if (!Object.hasOwn(n, a) && !Object.hasOwn(r, a)) return !1;
  for (let [a, s] of Object.entries(n)) if (!s(e[a])) return !1;
  for (let [a, s] of Object.entries(r))
    if (e[a] !== void 0 && !s(e[a])) return !1;
  return !0;
}
function mn(e, n = {}) {
  return (r) => {
    if (!B(r) || typeof r.kind != "string") return !1;
    let a = Object.hasOwn(e, r.kind) ? e[r.kind] : void 0,
      s = Object.hasOwn(n, r.kind) ? n[r.kind] : void 0;
    return a != null && Te(r, { kind: H, ...a }, s);
  };
}
var Ot = G(Object.keys(bt)),
  Gs = /^(view|overlay):[a-z0-9-]+(\/[a-z0-9-]+)*$/,
  Fs = (e) =>
    !B(e) ||
    typeof e.entrypointId != "string" ||
    !Te(e, { surface: G(yt), entrypointId: H })
      ? !1
      : e.surface === "shell"
        ? e.entrypointId === ""
        : Gs.test(e.entrypointId),
  Ks = mn(
    {
      navigation: { action: G(pt), surface: Ot, entrypointId: H, startMs: N },
      selection: { startMs: N },
      interaction: { event: G(ut), startMs: N },
    },
    {
      navigation: { absorbedInputs: P },
      interaction: {
        route: Fs,
        target: (e) => Te(e, { component: Sn }, { role: G(St) }),
      },
    },
  ),
  Hs = mn({
    render: { component: Sn, phase: G(ft), compiled: yn, baseMs: N },
    commit: { priority: G(mt) },
    effects: { boundary: H, passiveMs: N },
    "component-effects": { component: Sn, phase: G(_t) },
  }),
  js = mn({
    settle: { entrypointId: H, chunk: G(gt), cached: yn },
    presented: { ticket: P, entrypointId: H, surface: Ot, commitClass: G(un) },
    publish: { store: H, commit: G(un), version: P, listeners: P },
    rpc: { edge: H, method: H, ok: yn, failureCode: Nt(H) },
    event: { event: H, interactionId: P, inputDelayMs: N, processingMs: N },
    "long-animation-frame": {
      blockingMs: N,
      renderMs: N,
      styleAndLayoutMs: N,
      scripts: P,
    },
  }),
  kt = (e) =>
    Te(e, {
      id: P,
      parent: Nt(P),
      startMs: N,
      durationMs: N,
      selfMs: N,
      detail: Hs,
    }),
  xt = (e) => Te(e, { startMs: N, durationMs: N, detail: js }),
  Dt = {
    version: Vs,
    lastCommitMs: Ve,
    commitCount: P,
    renderSelfMs: Ve,
    sampleRate: Bs,
  },
  Lm = {
    ...Dt,
    id: It,
    root: Ks,
    endMs: N,
    closedBy: G(pn),
    spans: Be(kt),
    folded: P,
    dropped: P,
  },
  Mm = { ticket: P, measures: Be(xt), presentedMs: Ve, dismissedMs: Ve },
  wm = {
    ...Dt,
    id: It,
    startMs: N,
    endMs: N,
    closedBy: G(Et),
    spans: Be(kt),
    measures: Be(xt),
    folded: P,
    dropped: P,
  };
function Mt() {
  Ys();
}
function Ys() {
  let e = ht(process.argv);
  e !== null && Z.contextBridge.exposeInMainWorld(At, e);
}
function wt() {
  st(Z.contextBridge, Z.ipcRenderer);
}
var If = process.type === "browser" ? dt(Z.app) : () => "unknown";
function Lt(e) {
  return {
    invoke: (n, r) => e.invoke(n, r),
    on: (n, r) => {
      let a = (s, y) => {
        r(y);
      };
      return (
        e.on(n, a),
        () => {
          e.off(n, a);
        }
      );
    },
  };
}
function fn(e) {
  return e != null ? Lt(e.ipcRenderer) : Lt(Z.ipcRenderer);
}
function $s(e) {
  return e === null ? "null" : Array.isArray(e) ? "array" : typeof e;
}
function Q(e, n, r) {
  return { ok: !1, path: e, expected: n, received: $s(r) };
}
function qs(e) {
  return e.optional === !0;
}
function j(e, n) {
  return {
    expects: e,
    check: n,
    "~standard": {
      version: 1,
      vendor: "dune",
      validate: (r) => {
        let a = n(r, []);
        return a.ok
          ? { value: a.value }
          : {
              issues: [
                {
                  message: `must be ${a.expected}, got ${a.received}`,
                  path: a.path,
                },
              ],
            };
      },
    },
  };
}
function Xs(e, n, r) {
  if (!B(n)) return Q(r, "object", n);
  let a = [];
  for (let [s, y] of Object.entries(e)) {
    let C = Object.hasOwn(n, s) ? n[s] : void 0;
    if (C === void 0 && qs(y)) continue;
    let h = y.check(C, [...r, s]);
    if (!h.ok) return h;
    a.push([s, h.value]);
  }
  return { ok: !0, value: Object.fromEntries(a) };
}
function i() {
  return j("string", (e, n) =>
    typeof e == "string" ? { ok: !0, value: e } : Q(n, "string", e),
  );
}
function b() {
  return j("number", (e, n) =>
    typeof e != "number"
      ? Q(n, "number", e)
      : Number.isFinite(e)
        ? { ok: !0, value: e }
        : {
            ok: !1,
            path: n,
            expected: "number",
            received: "non-finite number",
          },
  );
}
function S() {
  return j("boolean", (e, n) =>
    typeof e == "boolean" ? { ok: !0, value: e } : Q(n, "boolean", e),
  );
}
function u(e) {
  let n = JSON.stringify(e);
  return j(n, (r, a) => (r === e ? { ok: !0, value: e } : Q(a, n, r)));
}
function d(e) {
  return { ...e, optional: !0 };
}
function v(e) {
  let n = `${e.expects} | null`;
  return j(n, (r, a) => {
    if (r === null) return { ok: !0, value: null };
    let s = e.check(r, a);
    return s.ok || s.path.length !== a.length
      ? s
      : { ok: !1, path: a, expected: n, received: s.received };
  });
}
function R(...e) {
  let n = [...new Set(e.map((r) => r.expects))].join(" | ");
  return j(n, (r, a) => {
    for (let s of e) {
      let y = s.check(r, a);
      if (y.ok) return y;
    }
    return Q(a, n, r);
  });
}
function A(e) {
  return j(`array of ${e.expects}`, (n, r) => {
    if (!Array.isArray(n)) return Q(r, "array", n);
    let a = n,
      s = [];
    for (let [y, C] of a.entries()) {
      let h = e.check(C, [...r, y]);
      if (!h.ok) return h;
      s.push(h.value);
    }
    return { ok: !0, value: s };
  });
}
function p(e) {
  return j("object", (n, r) => Xs(e, n, r));
}
function de(e) {
  let n = `record of ${e.expects}`;
  return j(n, (r, a) => {
    if (!B(r)) return Q(a, "object", r);
    let s = [];
    for (let [y, C] of Object.entries(r)) {
      let h = e.check(C, a);
      if (!h.ok) return { ok: !1, path: a, expected: n, received: h.received };
      s.push([y, h.value]);
    }
    return { ok: !0, value: Object.fromEntries(s) };
  });
}
function he() {
  return j("Uint8Array", (e, n) =>
    e instanceof Uint8Array ? { ok: !0, value: e } : Q(n, "Uint8Array", e),
  );
}
function _n() {
  return j("unknown", (e) => ({ ok: !0, value: e }));
}
function le() {
  return {};
}
function zs(e) {
  let n = e["~standard"];
  return (
    typeof n == "object" &&
    n !== null &&
    n.version === 1 &&
    typeof n.validate == "function"
  );
}
var Ge = class extends Error {
  constructor(n) {
    (super(
      `rpcMethod().args: field "${n}" is not an rpc field validator; pass rpc* combinators or one Standard Schema v1 value.`,
    ),
      (this.name = "RpcMethodDeclarationError"));
  }
};
function t() {
  return {
    noArgs: { schema: null },
    args: (e) => {
      if (zs(e)) return { schema: e };
      for (let [n, r] of Object.entries(e))
        if (typeof r?.check != "function") throw new Ge(n);
      return { schema: p(e) };
    },
  };
}
function Ce(e, n) {
  return Object.freeze({
    kind: "rpc-edge",
    edge: e,
    methods: n.methods,
    hasEvents: n.events != null,
  });
}
var Js = "__DUNE_DEVTOOLS_HOOK__";
function Zs(e) {
  return B(e) && e.version === 1 && typeof e.register == "function";
}
function Pt(e = globalThis) {
  let n = B(e) ? e[Js] : void 0;
  return Zs(n) ? n : null;
}
var Ut = "edge/unknown-method",
  gn = "edge/transport-failed";
var Vt = "edge/handler-failed";
var ee = class extends Error {
  code;
  detail;
  constructor(n) {
    (super(`${n.code}: ${n.detail}`),
      (this.name = "EdgeCallFailure"),
      (this.code = n.code),
      (this.detail = n.detail));
  }
};
function vt(e) {
  return typeof e != "object" || e == null || !("ok" in e)
    ? !1
    : typeof e.ok == "boolean";
}
function Qs(e, n) {
  return `dune-rpc:${e}:m:${n}`;
}
function Bt(e, n) {
  return `dune-rpc:${e}:e:${n}`;
}
function ed(e) {
  return `dune-rpc:${e}:probe`;
}
var Jf = p({});
function Fe(e, n, r = {}) {
  let a = {},
    s = r.measures ?? null,
    y = async (I, U) => {
      let x = U instanceof Error ? U.message : String(U),
        V;
      try {
        V = await n.invoke(ed(e.edge), I);
      } catch {
        return new ee({ code: gn, detail: x });
      }
      return vt(V) && !V.ok && V.failure.code === Ut
        ? new ee(V.failure)
        : new ee({ code: gn, detail: x });
    },
    C = async (I, U) => {
      let x;
      try {
        x = await n.invoke(Qs(e.edge, I), U);
      } catch (V) {
        throw await y(I, V);
      }
      if (!vt(x))
        throw new ee({
          code: Vt,
          detail: "The edge replied outside its envelope.",
        });
      if (x.ok) return x.value;
      throw new ee(x.failure);
    },
    h = (I, U) => {
      if (s == null) return C(I, U);
      let x = s.now(),
        V = (se, _s) => {
          s.record({
            startMs: x,
            durationMs: s.now() - x,
            detail: {
              kind: "rpc",
              edge: e.edge,
              method: I,
              ok: se,
              failureCode: _s,
            },
          });
        };
      return C(I, U).then(
        (se) => (V(!0, null), se),
        (se) => {
          throw (V(!1, se instanceof ee ? se.code : null), se);
        },
      );
    };
  for (let [I, { schema: U }] of Object.entries(e.methods))
    a[I] = U === null ? () => h(I, {}) : (x) => h(I, x);
  return (
    e.hasEvents &&
      (a.subscribe = (I) => {
        let U = [];
        for (let [x, V] of Object.entries(I))
          V != null && U.push(n.on(Bt(e.edge, x), V));
        return () => {
          for (let x of U) x();
        };
      }),
    Pt()?.register({
      kind: "rpc-edge",
      role: "bridge",
      declaration: e,
      trust: [],
    }),
    a
  );
}
var O = require("electron");
function l(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Gt(e) {
  let n;
  try {
    n = JSON.parse(e);
  } catch {
    n = void 0;
  }
  return n;
}
function be(e) {
  if (e === null) return !0;
  switch (typeof e) {
    case "string":
    case "boolean":
      return !0;
    case "number":
      return Number.isFinite(e);
    case "object":
      return Array.isArray(e)
        ? e.every(be)
        : l(e) && Object.values(e).every(be);
    default:
      return !1;
  }
}
function Ft(e) {
  return e === "darwin" || e === "linux";
}
var Kt = "sand:encode-png";
var En = Uint8Array.of(0, 0, 0, 1, 115, 82, 71, 66, 0, 174, 206, 28, 233);
function Ht(e) {
  let n = new Uint8Array(e.byteLength + En.byteLength);
  return (
    n.set(e.subarray(0, 33)),
    n.set(En, 33),
    n.set(e.subarray(33), 33 + En.byteLength),
    n
  );
}
var jt = "sand:main-edge-served";
var Wt = "sand:network-online";
var Yt = "sand:renderer-alive";
var $t = "sand:renderer-boot-gate-landed",
  qt = "sand:renderer-boot-gate-opened";
function nd(e) {
  return (
    typeof e == "string" &&
    e.length > 0 &&
    e === e.trim() &&
    !e.includes("/") &&
    !e.includes("\\") &&
    !e.includes("\0") &&
    e !== "." &&
    e !== ".."
  );
}
function $(e) {
  return nd(e) ? e : null;
}
var td = "data:image/svg+xml",
  rd = 64 * 1024;
function An(e) {
  return typeof e == "string" && e.startsWith(td) && e.length <= rd;
}
var Rn = 64;
function od(e) {
  return (
    typeof e == "object" &&
    e !== null &&
    "agentId" in e &&
    "name" in e &&
    "markSvgDataUrl" in e &&
    $(e.agentId) !== null &&
    typeof e.name == "string" &&
    e.name.trim().length > 0 &&
    An(e.markSvgDataUrl)
  );
}
function Xt(e) {
  return Array.isArray(e) && e.length <= Rn && e.every(od);
}
var Tn = 640;
function zt(e) {
  return typeof e == "number" && Number.isInteger(e) && e >= 0 && e <= Tn;
}
var Ke = 16384;
function Jt(e) {
  return typeof e == "number" && Number.isInteger(e) && Math.abs(e) <= Ke;
}
var hn = 64;
function Zt(e) {
  return typeof e == "string" && e.trim().length > 0 && e.length <= hn;
}
function Ie(e, n) {
  let r = Object.getOwnPropertyDescriptor(e, n);
  return r !== void 0 && "value" in r ? r.value : void 0;
}
function Cn(e) {
  return typeof e == "number" && Number.isInteger(e) && e >= 0;
}
function Qt(e) {
  if (typeof e != "object" || e === null) return null;
  try {
    let n = Object.getPrototypeOf(e);
    if (n !== Object.prototype && n !== null) return null;
    let r = Ie(e, "usedBytes"),
      a = Ie(e, "limitBytes"),
      s = Ie(e, "loadedAgents"),
      y = Ie(e, "loadedTranscriptEntries"),
      C = Ie(e, "idleMinutesLast15m");
    return typeof r != "number" ||
      !Number.isFinite(r) ||
      r < 0 ||
      typeof a != "number" ||
      !Number.isFinite(a) ||
      a <= 0
      ? null
      : {
          ...{ usedBytes: r === 0 ? 0 : r, limitBytes: a },
          ...(Cn(s) ? { loadedAgents: s } : {}),
          ...(Cn(y) ? { loadedTranscriptEntries: y } : {}),
          ...(Cn(C) ? { idleMinutesLast15m: C } : {}),
        };
  } catch {
    return null;
  }
}
function er(e, n) {
  return typeof n == "string" && Object.hasOwn(e, n);
}
function In(e) {
  return e === null ? "null" : Array.isArray(e) ? "array" : typeof e;
}
function nr(e, n) {
  return tr(e, (r, a) => {
    let s = n(r);
    return s.ok ? s : { ok: !1, path: a, expected: e, received: In(r) };
  });
}
function tr(e, n) {
  return {
    expects: e,
    check: n,
    "~standard": {
      version: 1,
      vendor: "sand",
      validate: (r) => {
        let a = n(r, []);
        return a.ok
          ? { value: a.value }
          : {
              issues: [
                {
                  message: `must be ${a.expected}, got ${a.received}`,
                  path: a.path,
                },
              ],
            };
      },
    },
  };
}
function _(e, n) {
  return nr(e, (r) => (n(r) ? { ok: !0, value: r } : { ok: !1 }));
}
function ne(e, n) {
  return nr(e, (r) => {
    let a = n(r);
    return a.success ? { ok: !0, value: a.data } : { ok: !1 };
  });
}
var bn = 64 * 1024;
function ad(e) {
  if (e.length > bn || new TextEncoder().encode(e).byteLength > bn)
    return `string over ${bn} bytes`;
  if (e.trim().length === 0) return null;
  let n = Gt(e);
  return l(n) ? null : n === void 0 ? "malformed JSON" : `JSON ${In(n)}`;
}
var $_ = tr("JSON object string", (e, n) => {
    let r = (s) => ({
      ok: !1,
      path: n,
      expected: "JSON object string",
      received: s,
    });
    if (typeof e != "string") return r(In(e));
    let a = ad(e);
    return a === null ? { ok: !0, value: e } : r(a);
  }),
  m = _("non-empty string", (e) => typeof e == "string" && e.length > 0),
  c = _("non-blank string", (e) => typeof e == "string" && e.trim().length > 0),
  q_ = _(`non-blank string of at most ${hn} characters`, Zt),
  ue = ne("agent id", (e) => {
    let n = $(e);
    return n === null ? { success: !1 } : { success: !0, data: n };
  }),
  He = ne("non-empty string", (e) => {
    if (typeof e != "string") return { success: !1 };
    let n = e.trim();
    return n.length > 0 ? { success: !0, data: n } : { success: !1 };
  });
function pe(e, n) {
  return _(e, (r) => n.some((a) => a === r));
}
var X_ = p({
  acceptedConsent: d(u(!0)),
  remember: d(pe("meeting join remember", ["meeting", "all"])),
  internalMeeting: d(u(!0)),
});
function E(e, n) {
  return ne("telemetry report", (r) => {
    if (!l(r) || !e(r)) return { success: !1 };
    let a = typeof n == "function" ? n(r) : n,
      s = {};
    for (let y of Object.keys(a))
      er(a, y) && Object.hasOwn(r, y) && (s[y] = r[y]);
    return e(s) ? { success: !0, data: s } : { success: !1 };
  });
}
var rr = ne("heap metrics report", (e) => {
  let n = Qt(e);
  return n === null ? { success: !1 } : { success: !0, data: n };
});
var id = _("svg data url", An),
  sd = _(`at most ${Rn} mount targets`, Xt),
  dd = _(`integer from 0 to ${Tn}`, zt),
  or = _(`integer from -${Ke} to ${Ke}`, Jt),
  ar = Ce("desktop-mount", {
    methods: {
      mount: t().args({ agentId: c, name: c, markSvgDataUrl: id }),
      unmount: t().noArgs,
      offerChoices: t().args({ choices: sd }),
      read: t().noArgs,
      readChoices: t().noArgs,
      readLayout: t().noArgs,
      submitPrompt: t().args({ prompt: He }),
      switchTo: t().args({ agentId: c }),
      unmountSelf: t().noArgs,
      reachForMenu: t().args({ heightPx: dd }),
      movePanel: t().args({ dx: or, dy: or }),
      endPanelMove: t().noArgs,
    },
    events: le(),
    failureCodes: le(),
  });
var ir =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var Nn = "user";
var ld = "automation";
var rg = 100 * 1024 * 1024;
var je = "/cursor/stores";
var We = "canvases";
var sr = `${je}/${Nn}/${We}`,
  dr = `${je}/${ld}/${We}`;
var pd = `${je}/${Nn}`;
function On(e) {
  let n = e.trim().toLowerCase();
  return ir.test(n) ? { ok: !0, value: n } : { ok: !1 };
}
var lr = ["image/png", "image/jpeg", "image/webp"];
var xg = lr.join(",");
function kn(e) {
  return lr.some((n) => n === e);
}
function cr(e) {
  return kn(e.contentType)
    ? e.byteLength <= 0
      ? "empty"
      : e.byteLength > 2097152
        ? "too-large"
        : null
    : "unsupported-type";
}
var yd = /^\d{6}$/;
function ur(e) {
  return typeof e == "string" && yd.test(e);
}
var pr = ["requestLimitIncrease"];
var Sd = 2147483647;
function yr(e) {
  return l(e)
    ? e.mode === "none" || e.mode === "unlimited"
      ? !0
      : e.mode === "fixed" &&
        typeof e.limitDollars == "number" &&
        Number.isInteger(e.limitDollars) &&
        e.limitDollars > 0 &&
        e.limitDollars < Sd
    : !1;
}
var md = "startOnDemandPaymentMethodSetup";
var Bg = new Set([...pr, md]);
var fd = { owner: "owner", team: "team" };
var Zg = new Set(Object.values(fd));
var Sr = ["user", "manager"];
var mr = ["managers", "everyone"];
var _d = "team-fresh",
  Qg = `${_d}:`;
var fr = ["github", "gitlab", "bitbucket", "azure-devops"];
var _r = /^[A-Za-z0-9_-]{21}$/;
var gd = /^[a-z0-9][a-z0-9-]{2,63}$/;
function gr(e) {
  return gd.test(e);
}
function Ne(e) {
  if (e.length === 0) return !1;
  try {
    return (new Intl.DateTimeFormat("en-US", { timeZone: e }), !0);
  } catch {
    return !1;
  }
}
var Ed = [
    "unspecified",
    "scheduled",
    "claimed",
    "running",
    "waiting-for-image",
    "completed",
    "missed",
    "failed",
    "cancelled",
  ],
  Ad = /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  uE = new Set(Ed);
function Er(e) {
  return e == null || typeof e != "object" || Array.isArray(e)
    ? !1
    : "localTime" in e &&
        typeof e.localTime == "string" &&
        Ad.test(e.localTime) &&
        "timeZone" in e &&
        typeof e.timeZone == "string" &&
        Ne(e.timeZone) &&
        "recurring" in e &&
        typeof e.recurring == "boolean";
}
function Ar(e) {
  return (
    e != null &&
    typeof e == "object" &&
    !Array.isArray(e) &&
    "dismissTerminalOutcome" in e &&
    typeof e.dismissTerminalOutcome == "boolean"
  );
}
var Rd = ["system", "light", "dark"];
function Rr(e) {
  return typeof e == "string" && Rd.includes(e);
}
var Td = [
  "ping-1-open-blip",
  "ping-2-tick",
  "ping-3-double-tick",
  "ping-4-chime-a",
  "ping-5-chime-b",
];
function hd(e) {
  return typeof e == "string" && Td.some((n) => n === e);
}
function Tr(e) {
  return typeof e != "object" ||
    e == null ||
    Array.isArray(e) ||
    !("sound" in e) ||
    !hd(e.sound)
    ? !1
    : "playSound" in e && typeof e.playSound == "boolean";
}
var Cd =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  bd = "general",
  hr = { kind: "absent" },
  Cr = { kind: "rejects-the-report" };
function Ye(e, n) {
  if (e == null) return hr;
  if (typeof e != "string") return Cr;
  let r = e.trim();
  return r.length === 0
    ? hr
    : r.length > n
      ? Cr
      : { kind: "present", value: r };
}
function Id(e) {
  if (typeof e != "object" || e == null) return null;
  let n = Ye("callId" in e ? e.callId : void 0, 128);
  if (n.kind !== "present") return null;
  let r = "rating" in e ? e.rating : void 0;
  if (r !== "up" && r !== "down") return null;
  let a = Ye("requestId" in e ? e.requestId : void 0, 128);
  if (a.kind === "rejects-the-report") return null;
  let s = Ye(
    "realtimeConversationId" in e ? e.realtimeConversationId : void 0,
    128,
  );
  return s.kind === "rejects-the-report"
    ? null
    : {
        callId: n.value,
        rating: r,
        ...(a.kind === "present" ? { requestId: a.value } : {}),
        ...(s.kind === "present" ? { realtimeConversationId: s.value } : {}),
      };
}
function br(e) {
  if (
    typeof e != "object" ||
    e == null ||
    !("message" in e) ||
    typeof e.message != "string"
  )
    return null;
  let n = e.message.trim();
  if (
    n.length === 0 ||
    n.length > 1e4 ||
    !("accountSlot" in e) ||
    typeof e.accountSlot != "string"
  )
    return null;
  let r = e.accountSlot.trim();
  if (
    r.length === 0 ||
    r.length > 512 ||
    !("submissionId" in e) ||
    typeof e.submissionId != "string" ||
    !Cd.test(e.submissionId)
  )
    return null;
  let a = e.submissionId,
    s = Ye("conversationId" in e ? e.conversationId : void 0, 512);
  if (s.kind === "rejects-the-report") return null;
  let y = {
      accountSlot: r,
      message: n,
      submissionId: a,
      ...(s.kind === "present" ? { conversationId: s.value } : {}),
    },
    C = ("kind" in e ? e.kind : void 0) ?? bd;
  if (C === "voice-call") {
    let I = Id("voiceCall" in e ? e.voiceCall : void 0);
    return I === null ? null : { ...y, kind: "voice-call", voiceCall: I };
  }
  if (C !== "general") return null;
  let h;
  if (
    "wantsResponse" in e &&
    e.wantsResponse !== void 0 &&
    e.wantsResponse !== null
  ) {
    if (typeof e.wantsResponse != "boolean") return null;
    h = e.wantsResponse;
  }
  return {
    ...y,
    kind: "general",
    ...(h === void 0 ? {} : { wantsResponse: h }),
  };
}
var Nd = [
    { tag: "en", endonym: "English", englishName: "English", direction: "ltr" },
    {
      tag: "hi",
      endonym: "\u0939\u093F\u0928\u094D\u0926\u0940",
      englishName: "Hindi",
      direction: "ltr",
    },
    {
      tag: "zh-CN",
      endonym: "\u7B80\u4F53\u4E2D\u6587",
      englishName: "Simplified Chinese",
      direction: "ltr",
    },
    {
      tag: "zh-TW",
      endonym: "\u7E41\u9AD4\u4E2D\u6587",
      englishName: "Traditional Chinese",
      direction: "ltr",
    },
    { tag: "pl", endonym: "Polski", englishName: "Polish", direction: "ltr" },
    {
      tag: "es",
      endonym: "Espa\xF1ol",
      englishName: "Spanish",
      direction: "ltr",
    },
    {
      tag: "pt",
      endonym: "Portugu\xEAs",
      englishName: "Portuguese",
      direction: "ltr",
    },
    {
      tag: "ja",
      endonym: "\u65E5\u672C\u8A9E",
      englishName: "Japanese",
      direction: "ltr",
    },
    {
      tag: "fr",
      endonym: "Fran\xE7ais",
      englishName: "French",
      direction: "ltr",
    },
    {
      tag: "ko",
      endonym: "\uD55C\uAD6D\uC5B4",
      englishName: "Korean",
      direction: "ltr",
    },
    { tag: "de", endonym: "Deutsch", englishName: "German", direction: "ltr" },
    {
      tag: "ru",
      endonym: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
      englishName: "Russian",
      direction: "ltr",
    },
    {
      tag: "tr",
      endonym: "T\xFCrk\xE7e",
      englishName: "Turkish",
      direction: "ltr",
    },
    {
      tag: "ar",
      endonym: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      englishName: "Arabic",
      direction: "rtl",
    },
    {
      tag: "it",
      endonym: "Italiano",
      englishName: "Italian",
      direction: "ltr",
    },
    { tag: "sv", endonym: "Svenska", englishName: "Swedish", direction: "ltr" },
    {
      tag: "uk",
      endonym: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430",
      englishName: "Ukrainian",
      direction: "ltr",
    },
    {
      tag: "nl",
      endonym: "Nederlands",
      englishName: "Dutch",
      direction: "ltr",
    },
    {
      tag: "el",
      endonym: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC",
      englishName: "Greek",
      direction: "ltr",
    },
    {
      tag: "af",
      endonym: "Afrikaans",
      englishName: "Afrikaans",
      direction: "ltr",
    },
    {
      tag: "he",
      endonym: "\u05E2\u05D1\u05E8\u05D9\u05EA",
      englishName: "Hebrew",
      direction: "rtl",
    },
    {
      tag: "vi",
      endonym: "Ti\u1EBFng Vi\u1EC7t",
      englishName: "Vietnamese",
      direction: "ltr",
    },
    {
      tag: "id",
      endonym: "Bahasa Indonesia",
      englishName: "Indonesian",
      direction: "ltr",
    },
    {
      tag: "ur",
      endonym: "\u0627\u0631\u062F\u0648",
      englishName: "Urdu",
      direction: "rtl",
    },
    {
      tag: "th",
      endonym: "\u0E44\u0E17\u0E22",
      englishName: "Thai",
      direction: "ltr",
    },
    {
      tag: "bn",
      endonym: "\u09AC\u09BE\u0982\u09B2\u09BE",
      englishName: "Bengali",
      direction: "ltr",
    },
    {
      tag: "cs",
      endonym: "\u010Ce\u0161tina",
      englishName: "Czech",
      direction: "ltr",
    },
    {
      tag: "hu",
      endonym: "Magyar",
      englishName: "Hungarian",
      direction: "ltr",
    },
    {
      tag: "nb",
      endonym: "Norsk bokm\xE5l",
      englishName: "Norwegian Bokm\xE5l",
      direction: "ltr",
    },
    { tag: "da", endonym: "Dansk", englishName: "Danish", direction: "ltr" },
    { tag: "fi", endonym: "Suomi", englishName: "Finnish", direction: "ltr" },
    {
      tag: "mr",
      endonym: "\u092E\u0930\u093E\u0920\u0940",
      englishName: "Marathi",
      direction: "ltr",
    },
    {
      tag: "te",
      endonym: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41",
      englishName: "Telugu",
      direction: "ltr",
    },
    {
      tag: "sw",
      endonym: "Kiswahili",
      englishName: "Swahili",
      direction: "ltr",
    },
    { tag: "ha", endonym: "Hausa", englishName: "Hausa", direction: "ltr" },
    {
      tag: "ta",
      endonym: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD",
      englishName: "Tamil",
      direction: "ltr",
    },
  ],
  Od = Nd.map((e) => e.tag);
var kd = ["system", ...Od];
function Ir(e) {
  return typeof e == "string" && kd.includes(e);
}
var xd = [
    "image",
    "video",
    "audio",
    "pdf",
    "markdown",
    "table",
    "json",
    "text",
    "document",
    "archive",
    "file",
  ],
  IE = xd[10];
function Dd(e) {
  if (typeof e != "string") return null;
  let n = /^tile-([1-9]\d{1,3})$/.exec(e);
  if (n == null) return null;
  let r = Number(n[1]);
  return r >= 16 && r <= 1024 ? r : null;
}
function Ld(e) {
  if (typeof e != "string") return null;
  let n = /^fit-([1-9]\d{2,3})$/.exec(e);
  if (n == null) return null;
  let r = Number(n[1]);
  return r % 256 === 0 && r <= 8192 ? r : null;
}
function Md(e) {
  return Dd(e) != null;
}
function wd(e) {
  return Ld(e) != null;
}
function Nr(e) {
  return e === "preview" || e === "original" || Md(e) || wd(e);
}
var xn = 1500;
function Or(e) {
  let n = e.trim();
  return n.length === 0 ? "empty" : n.length > xn ? "too-long" : "ok";
}
var qe = "voice";
var $E = `${qe}:`;
var Dn = {
  auto: "Auto-detect",
  en: "English",
  "ar-EG": "Arabic (Egypt)",
  "ar-SA": "Arabic (Saudi Arabia)",
  "ar-AE": "Arabic (United Arab Emirates)",
  bn: "Bengali",
  ca: "Catalan",
  zh: "Chinese (Simplified)",
  da: "Danish",
  nl: "Dutch",
  fi: "Finnish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pl: "Polish",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  ru: "Russian",
  "es-MX": "Spanish (Mexico)",
  "es-ES": "Spanish (Spain)",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  vi: "Vietnamese",
};
function Pd(e) {
  return e !== void 0 && Object.hasOwn(Dn, e);
}
var zE = Object.keys(Dn)
  .filter(Pd)
  .map((e) => ({ id: e, label: Dn[e] }));
var re = 2e3,
  rA = `The task was not sent: request exceeds ${re} characters. Reformulate it within the limit while preserving every constraint, especially prohibitions and approval requirements. Do not drop constraints or split the task into executable pieces. Ask the caller to clarify if it cannot fit safely.`;
var oe = "end_the_call",
  T = "send_task",
  q = "recall_text_messages",
  te = "search_conversations",
  F = "stay_silent",
  vd = [oe, T, q, te, F];
function Xe(e) {
  return vd.some((n) => n === e);
}
var k = "work_landed",
  X = "work_overheard",
  Ln = "user_message";
var Ud = 6;
var kr = ["this-chat", "earlier", "everything"],
  xr = ["say-no-record", "send-task"],
  Mn = `the shared history between you and this caller: this chat, earlier chats, and earlier phone calls with them. Earlier calls are first-class here \u2014 what you two said on a prior call lives in this record, not in the chat window. "you" is what you said or sent, "them" is what they typed or said. Nobody else is in it: not their other agents, not other people, not Slack, mail, or any other app. Word from any of those is a ${T} job, never a search of this record.`,
  wn = `Use it for a fact from before this call that the last few messages of this chat may not hold \u2014 especially anything from an earlier phone call with them. When they ask what you said on a prior call, when you spoke, on the phone, or "last call", search here (prefer scope "earlier" or "everything") and answer from those hits as something you already know together. Lead with the fact; say when only if they ask, or if it changes the answer. The chat window alone will miss earlier calls. When a later result corrects an earlier one, the newest wins. When two results both fit what they asked, ask which they mean before answering. When nothing comes back, say nothing about what the record holds or lacks; ${T} it and answer from what lands. Never invent one. Something they told you on this call beats anything the record says.`,
  Pn = `the written chat between you and this caller: "you" is what you sent them, "them" is what they typed to you. Nobody else writes in it, and nothing anyone else sent them is in it: not their other agents, not other people, not Slack, mail, or any other app. Word from any of those is a ${T} job, never a read of this chat.`,
  ze = `If the answer might already be in the written chat, call ${q}. Do not guess it, do not say you do not know, and do not ${T} for it until you have read that chat.`,
  Vd = `If the answer might already be in the written chat you have not read this call, ${q} first.`,
  Bd = {
    recall: {
      ifUnread: Vd,
      when: ze,
      textOnly: "Written recall contains text, not sign-in cards.",
      sendTaskFirst: `${q} first when it might already be in this written chat`,
    },
    search: {
      ifUnread: `If the answer is not in the recent lines and might be in this chat or an earlier call, ${te} for the subject.`,
      when: `If the answer is not in the recent lines and might be in this chat or an earlier call, call ${te}. Do not guess it, do not say you do not know, and do not ${T} until you have searched.`,
      textOnly:
        "Search and the recent lines are text, not pictures or sign-in cards.",
      sendTaskFirst: `${te} first when it might already be in this chat or an earlier call and is not in the recent lines`,
    },
  };
var M = class {
  static sendTask(n = "recall") {
    let r = Bd[n].sendTaskFirst;
    return `Send a job that needs their computer, files, web, browser, or mail and chat they send. That call is a receipt, never the answer, and never the quick path. Speak a short beat on this response that names the job in how you talk, then call this. Never start that beat with a confirmation. Never say you are calling this tool. The outcome lands later as a ${k} entry. Do not use this for a take, a recap of this call, a quiz from words already on the line, a story, a joke, talk they asked you to do yourself, a fact already on the line, or a name or value they just spoke on this call \u2014 answer from that speech instead. If the useful answer needs a fact you do not have about their world, ${r}; use this only when it is not there.`;
  }
  static sendTaskRequest() {
    return `The job itself: what to do or find out, and what to come back with. Not the caller's sentence. Add their exact words only where the wording itself is part of the job. Maximum ${re} characters; preserve every constraint, prohibition, and approval requirement. Overlong requests are rejected, never truncated.`;
  }
  static recallTextMessages() {
    return `Read ${Pn} Oldest first. ${ze} Say nothing about calling this.`;
  }
  static searchConversations(n = Mn) {
    return `Search ${n} ${wn} Each hit says where and roughly when it was said, who said it, and the words, with a line before and after. At most ${Ud} hits come back, best first; "more" means the record holds others, so search again with different words if the answer is not among them. Say nothing about calling this.`;
  }
  static searchConversationsQuery() {
    return "A few words naming the fact you want: the thing, the name, the number, the place. Not the caller's whole sentence.";
  }
  static searchConversationsScope() {
    return 'Where to look: "this-chat" for this conversation only, "earlier" for earlier chats and calls only, "everything" for all of it. Leave it out to search everything.';
  }
  static searchConversationsId() {
    return "The id of a hit you already have. Pass it to read that message in full.";
  }
  static searchConversationsFrom() {
    return "First day to look in, YYYY-MM-DD. Same as to for one day. Leave it out when the question is not about a day.";
  }
  static searchConversationsTo() {
    return "Last day to look in, YYYY-MM-DD, inclusive.";
  }
  static searchConversationsIfMissing() {
    return '"send-task" when the caller asked you to retrieve a prior call or word from another person, agent, Slack, mail, the web, or another app; "say-no-record" when only the caller could supply the missing fact. Decide before seeing results.';
  }
  static staySilent() {
    return `Say nothing this turn. This is only for a last-landed ${k} or ${X} entry, when speaking would give them nothing new. Never use it when they just talked to you. Never on the unpaid turn after ${T}. Never on a ${k} outcome they have not heard. Never on the same turn as spoken words. The caller hears nothing. Say nothing about calling this.`;
  }
  static endTheCall() {
    return `Hang up and end this call. Use it only when the caller says a parting greeting like "all done", "bye", "thanks, that's all", "stop", "go away", "shut up", "stop listening", "leave me alone", "goodbye", or "hang up". An unclear pause, a task still open, "ok" in the middle of work, or a "stop" that cancels that work is not a hang-up. ALWAYS say your goodbye out loud first, including when hanging up is the last step of something else they asked for: the line drops the moment you call this, so nothing after it is heard. Never call it while they are still asking for something.`;
  }
};
var Dr = [
  "connecting_started",
  "mint_ok",
  "mint_failed",
  "socket_open",
  "socket_error",
  "socket_close",
  "session_created",
  "mic_granted",
  "mic_denied",
  "mic_timeout",
  "audible",
  "connecting_stuck",
  "connecting_abandoned",
];
function W(e, n) {
  return n === "absent" || n === "unrecognized"
    ? n
    : (e.find((r) => r === n) ?? "unrecognized");
}
var vn = [
    "not_configured",
    "unsupported_model",
    "rejected",
    "unreachable",
    "malformed_response",
  ],
  Un = ["429", "401", "403", "503"];
var Lr = "voice_mint_",
  mA = (() => {
    let e = new Map();
    for (let n of vn) {
      e.set(`${Lr}${n}`, { reason: n, http: "absent" });
      for (let r of Un) e.set(`${Lr}${n}_${r}`, { reason: n, http: r });
    }
    return e;
  })();
var Oe = class {
    static frame({ topic: n, eventId: r, texts: a, atMs: s }) {
      return {
        type: "async_update.add",
        event_id: r,
        async_update: {
          topic: n,
          payload: a.map((y) => ({
            message: { type: "text", content: y },
            timestampMs: s,
          })),
        },
      };
    }
  },
  Je = class e {
    static TOPIC = Ln;
    static CHAR_LIMIT = re;
    static EVENT_ID_PREFIX = "written-turn";
    static eventId(n) {
      return `${e.EVENT_ID_PREFIX}-${n}`;
    }
    static rides(n) {
      return n === "async-update";
    }
    static frame({ entryId: n, text: r, atMs: a }) {
      return Oe.frame({
        topic: e.TOPIC,
        eventId: e.eventId(n),
        texts: [r.slice(0, e.CHAR_LIMIT)],
        atMs: a,
      });
    }
  };
var Ze = class e {
  static EVENT_ID_PREFIX = "response_cancel.";
  static frame(n) {
    return { type: "response.cancel", event_id: `${e.EVENT_ID_PREFIX}${n}` };
  }
};
var Gd = { ack: k, progress: k, outcome: k, overheard: X },
  Fd = "{}",
  ke = class e {
    static SEEDED_TOOL = k;
    static OVERHEARD_TOOL = X;
    static CALL_ID_PREFIX = "seeded-nudge";
    static callId(n) {
      return `${e.CALL_ID_PREFIX}-${n}`;
    }
    static seededTool(n) {
      return Gd[n];
    }
    static progressNote({ kind: n, texts: r, atMs: a }) {
      let s = new Date(a).toISOString().replace(/\.\d{3}Z$/, "Z");
      return n === "overheard"
        ? { status: "in progress", steps: r, at: s }
        : { status: "landed", updates: r, at: s };
    }
    static isNudgeKind(n) {
      return (
        n === "ack" || n === "progress" || n === "outcome" || n === "overheard"
      );
    }
    static SPOKEN_KINDS = ["progress", "outcome"];
    static OVERHEARD_CHAR_LIMIT = re;
    static earnsASpokenTurn({ kind: n }) {
      return e.SPOKEN_KINDS.includes(n);
    }
    static delivery(n, r) {
      return e.earnsASpokenTurn(n)
        ? r === "async-update"
          ? "orchestrated"
          : "asked"
        : "filed";
    }
    static frames(n, r) {
      return e.delivery(n, r) === "orchestrated"
        ? [
            Oe.frame({
              topic: k,
              eventId: n.callId,
              texts: n.texts,
              atMs: n.atMs,
            }),
          ]
        : e.pair(n);
    }
    static pair({ callId: n, kind: r, texts: a, atMs: s }) {
      return [
        {
          type: "conversation.item.create",
          item: {
            type: "function_call",
            name: e.seededTool(r),
            call_id: n,
            arguments: Fd,
          },
        },
        {
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: n,
            output: JSON.stringify(
              e.progressNote({ kind: r, texts: a, atMs: s }),
            ),
          },
        },
      ];
    }
  };
var Mr = [
    "invalid_request_error",
    "server_error",
    "authentication_error",
    "rate_limit_error",
  ],
  wr = [
    "internal_error",
    "async_not_enabled",
    "invalid_request_error",
    "missing_tool_call_results",
  ],
  Pr = ["async_update_add", "response_cancel"];
var vr = ["1008", "1006", "1011", "1000", "heartbeat"],
  Ur = ["connecting", "live"],
  Kd = {
    "session-ready": !0,
    "conversation-created": !0,
    audio: !0,
    transcript: !0,
    truncation: !0,
    "assistant-delta": !0,
    tool: !0,
    "response-created": !0,
    "response-ended": !0,
    "speech-started": !0,
    "speech-stopped": !0,
    error: !0,
    other: !0,
  },
  Vn = Object.keys(Kd),
  Bn = [
    "session.update",
    "input_audio_buffer.append",
    "conversation.item.create",
    "conversation.item.truncate",
    "response.create",
    "response.cancel",
    "async_update.add",
  ],
  Vr = ["error", "close"],
  Br = ["running", "suspended", "closed", "interrupted"],
  MA = [
    [`${Je.EVENT_ID_PREFIX}-`, "async_update_add"],
    [`${ke.CALL_ID_PREFIX}-`, "async_update_add"],
    [Ze.EVENT_ID_PREFIX, "response_cancel"],
  ];
var Hd = [
    "hang_up",
    "voice_goodbye",
    "agent_archived",
    "window_closed",
    "account_changed",
    "idle",
    "far_end",
    "mint",
    "agent",
    "line_refused",
    "line_error",
    "microphone",
  ],
  jd = [
    "minted_ms",
    "caller_turns",
    "tool_calls",
    "send_tasks",
    "wire_errors",
    "interruptions",
    "reconnects",
  ],
  Wd = ["granted", "denied", "undetermined"],
  Yd = ["input_format_empty", "voice_processing_off", "tap_refused"],
  Qe = [
    "none",
    "built_in_mic",
    "built_in_receiver",
    "built_in_speaker",
    "bluetooth_hfp",
    "bluetooth_a2dp",
    "bluetooth_le",
    "car",
    "wired",
    "usb",
    "airplay",
    "other",
  ];
function z(e) {
  return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function $d(e) {
  let n = {},
    r = D(e, "reason");
  if (r !== void 0) {
    let a = Hd.find((s) => s === r);
    if (a === void 0) return;
    n.reason = a;
  }
  for (let a of jd) {
    let s = D(e, a);
    if (s !== void 0) {
      if (!z(s)) return;
      n[a] = s;
    }
  }
  return n;
}
function qd(e) {
  return typeof e == "string" && /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(e)
    ? e
    : "unrecognized";
}
function Xd(e) {
  return W(Ur, e);
}
function zd(e) {
  return e === !0 ? !0 : e === !1 ? !1 : "absent";
}
var ye = (e) => (n) => (n === void 0 ? void 0 : W(e, n)),
  w = (e) => (z(e) ? e : void 0),
  ae = (e) => (typeof e == "boolean" ? e : void 0),
  Fr = (e) =>
    typeof e == "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)
      ? e
      : void 0,
  Kr = {
    fault_last_in: ye(Vn),
    fault_last_in_ms: w,
    fault_last_out: ye(Bn),
    fault_last_out_ms: w,
    fault_last_in_control: ye(Vn),
    fault_last_in_control_ms: w,
    fault_last_out_control: ye(Bn),
    fault_last_out_control_ms: w,
    fault_updates: w,
    fault_last_update_ms: w,
    fault_responding: ae,
    fault_muted: ae,
    fault_via: ye(Vr),
    fault_hidden: ae,
    fault_online: ae,
    fault_audio: ye(Br),
    realtime_conversation_id: Fr,
    fault_send_task_owed: ae,
    fault_agent_running: ae,
    fault_news_owed: ae,
    fault_recovered: ae,
  },
  BA = Object.keys(Kr);
function Jd(e) {
  let n = {};
  for (let [r, a] of Object.entries(Kr)) {
    let s = a(D(e, r));
    s !== void 0 && (n[r] = s);
  }
  return n;
}
var Zd = 32767,
  Se = (e) => (n) => e.find((r) => r === n),
  Gr = (e) => (z(e) && e <= Zd ? e : void 0),
  Hr = {
    mic_permission: Se(Wd),
    mic_tap_installs: w,
    mic_tap_skip: Se(Yd),
    mic_input_hz: w,
    mic_input_channels: w,
    mic_frames_captured: w,
    mic_frames_sent: w,
    mic_peak: Gr,
    mic_rms: Gr,
    mic_first_sound_ms: w,
    speech_starts: w,
    route_in_start: Se(Qe),
    route_out_start: Se(Qe),
    route_in_end: Se(Qe),
    route_out_end: Se(Qe),
    route_changes: w,
    mute_toggles: w,
    muted_ms: w,
  },
  GA = Object.keys(Hr);
function Qd(e) {
  let n = {};
  for (let [r, a] of Object.entries(Hr)) {
    let s = a(D(e, r));
    s !== void 0 && (n[r] = s);
  }
  return n;
}
function D(e, n) {
  return n in e ? e[n] : void 0;
}
function el(e) {
  return (
    D(e, "fault_class") !== void 0 ||
    D(e, "fault_code") !== void 0 ||
    D(e, "fault_about") !== void 0
  );
}
function xe(e, n) {
  let r = D(e, "fault_stage");
  return !n && r === void 0 ? {} : { fault_stage: Xd(r) };
}
function nl(e) {
  if (
    typeof e != "object" ||
    e === null ||
    Array.isArray(e) ||
    !("call_id" in e) ||
    typeof e.call_id != "string" ||
    e.call_id.length !== 41 ||
    !/^call-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      e.call_id,
    ) ||
    !("telemetry_version" in e) ||
    e.telemetry_version !== "1" ||
    !("phase" in e)
  )
    return;
  let n = { call_id: e.call_id, telemetry_version: e.telemetry_version };
  switch (e.phase) {
    case "started":
      return { ...n, phase: e.phase };
    case "connected": {
      if (!("elapsed_ms" in e) || !z(e.elapsed_ms)) return;
      let a = D(e, "model");
      return {
        ...n,
        phase: e.phase,
        elapsed_ms: e.elapsed_ms,
        ...(a === void 0 ? {} : { model: qd(a) }),
      };
    }
    case "usage":
      return !("active_ms" in e) ||
        !z(e.active_ms) ||
        !("sequence" in e) ||
        !z(e.sequence)
        ? void 0
        : {
            ...n,
            phase: e.phase,
            active_ms: e.active_ms,
            sequence: e.sequence,
          };
    case "first_audio":
      return !("trigger" in e) ||
        (e.trigger !== "call_start" && e.trigger !== "user_speech") ||
        !("ttfa_ms" in e) ||
        !z(e.ttfa_ms)
        ? void 0
        : { ...n, phase: e.phase, trigger: e.trigger, ttfa_ms: e.ttfa_ms };
    case "ui_opened":
      return !("surface" in e) ||
        (e.surface !== "full_menu" && e.surface !== "transcript")
        ? void 0
        : { ...n, phase: e.phase, surface: e.surface };
    case "ended":
      if (
        !("outcome" in e) ||
        (e.outcome !== "hung_up" &&
          e.outcome !== "disconnected" &&
          e.outcome !== "failed" &&
          e.outcome !== "reset") ||
        !("connected" in e) ||
        typeof e.connected != "boolean" ||
        !("duration_ms" in e) ||
        !z(e.duration_ms) ||
        !("elapsed_ms" in e) ||
        !z(e.elapsed_ms) ||
        e.duration_ms > e.elapsed_ms ||
        (!e.connected && e.duration_ms !== 0)
      )
        return;
      let r = $d(e);
      return r === void 0
        ? void 0
        : {
            ...n,
            phase: e.phase,
            outcome: e.outcome,
            connected: e.connected,
            duration_ms: e.duration_ms,
            elapsed_ms: e.elapsed_ms,
            ...r,
            ...Qd(e),
          };
    case "fault": {
      if (!("fault_kind" in e)) return;
      if (e.fault_kind === "tool" || e.fault_kind === "relay")
        return { ...n, phase: e.phase, fault_kind: e.fault_kind, ...xe(e, !1) };
      if (e.fault_kind === "mint")
        return {
          ...n,
          phase: e.phase,
          fault_kind: "mint",
          fault_reason: W(vn, D(e, "fault_reason")),
          fault_http: W(Un, D(e, "fault_http")),
          ...xe(e, !0),
        };
      if (e.fault_kind === "socket")
        return {
          ...n,
          phase: e.phase,
          fault_kind: "socket",
          fault_close: W(vr, D(e, "fault_close")),
          fault_clean: zd(D(e, "fault_clean")),
          ...xe(e, !0),
          ...Jd(e),
        };
      if (e.fault_kind === "audio_backlog") {
        let s = D(e, "fault_dropped");
        return !z(s) || s === 0
          ? void 0
          : {
              ...n,
              phase: e.phase,
              fault_kind: "audio_backlog",
              fault_dropped: s,
              ...xe(e, !0),
            };
      }
      if (e.fault_kind !== "protocol") return;
      let a = { ...n, phase: e.phase, fault_kind: e.fault_kind };
      return el(e)
        ? {
            ...a,
            fault_class: W(Mr, D(e, "fault_class")),
            fault_code: W(wr, D(e, "fault_code")),
            fault_about: W(Pr, D(e, "fault_about")),
            ...xe(e, !1),
          }
        : a;
    }
    default:
      return;
  }
}
function jr(e) {
  let n = nl(e);
  if (
    n === void 0 ||
    typeof e != "object" ||
    e === null ||
    (n.phase === "fault" &&
      n.fault_kind === "protocol" &&
      !("fault_class" in n))
  )
    return !1;
  let r = { ...e };
  return (
    Object.keys(r).length === Object.keys(n).length &&
    Object.entries(n).every(([a, s]) => Object.hasOwn(r, a) && r[a] === s)
  );
}
var Gn = [
    {
      type: "function",
      name: T,
      description: M.sendTask(),
      parameters: {
        type: "object",
        properties: {
          request: { type: "string", description: M.sendTaskRequest() },
        },
        required: ["request"],
      },
    },
    {
      type: "function",
      name: q,
      description: M.recallTextMessages(),
      parameters: { type: "object", properties: {} },
    },
    {
      type: "function",
      name: F,
      description: M.staySilent(),
      parameters: { type: "object", properties: {} },
    },
    {
      type: "function",
      name: oe,
      description: M.endTheCall(),
      parameters: { type: "object", properties: {} },
    },
  ],
  tl = [
    {
      type: "function",
      name: te,
      description: M.searchConversations(),
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: M.searchConversationsQuery() },
          scope: {
            type: "string",
            description: M.searchConversationsScope(),
            enum: kr,
          },
          id: { type: "string", description: M.searchConversationsId() },
          from: { type: "string", description: M.searchConversationsFrom() },
          to: { type: "string", description: M.searchConversationsTo() },
          if_missing: {
            type: "string",
            description: M.searchConversationsIfMissing(),
            enum: xr,
          },
        },
        required: ["query", "if_missing"],
      },
    },
  ],
  De = class {
    static all() {
      return Gn;
    }
    static of(n) {
      return Gn.filter((r) => n.includes(r.name));
    }
    static descriptor(n) {
      let r = [...Gn, ...tl].find((a) => a.name === n);
      if (r === void 0)
        throw new Error(
          `VoiceCallSessionTools.descriptor: ${n} is not a voice tool`,
        );
      return r;
    }
    static worded(n, r) {
      let a = Xe(n.name) ? r[n.name] : void 0;
      if (a === void 0 || (a.description === void 0 && a.parameters === void 0))
        return n;
      let s = new Map(Object.entries(a.parameters ?? {})),
        y = Object.fromEntries(
          Object.entries(n.parameters.properties).map(([C, h]) => {
            let I = s.get(C);
            return [C, I === void 0 ? h : { ...h, description: I }];
          }),
        );
      return {
        ...n,
        description: a.description ?? n.description,
        parameters: { ...n.parameters, properties: y },
      };
    }
    static registers(n, r) {
      return r.some((a) => a.name === n);
    }
  };
var me = class e {
  static of(n) {
    return (
      e.KNOWN[n.name] ?? {
        line: `- ${n.name}: ${n.description}`,
        inFlight: [],
        receipt: null,
      }
    );
  }
  static searchLine(n) {
    return `- ${te}: search ${n} ${wn} Speak what you found as something you know, never as a search, a lookup, or a record you consulted.`;
  }
  static lines(n, r) {
    return n.map(
      (a) => (Xe(a.name) ? r[a.name]?.line : void 0) ?? e.of(a).line,
    );
  }
  static inFlight(n) {
    return n.flatMap((r) => e.of(r).inFlight);
  }
  static receipt(n) {
    return n.flatMap((r) => {
      let a = e.of(r).receipt;
      return a === null ? [] : [a];
    });
  }
  static KNOWN = {
    [T]: {
      line: `- ${T}: speak a short beat that names the job in how you talk, then send it. Never start that beat with a confirmation. Never say you are calling the tool. Work that needs their computer, files, web, browser, or mail and chat they send goes through it; do not refuse it. That call is a receipt, never the outcome, and never the quick path. The outcome lands later, on its own, as a ${k} entry.`,
      inFlight: [],
      receipt: null,
    },
    [q]: { line: `- ${q}: read ${Pn} ${ze}`, inFlight: [], receipt: null },
    [te]: { line: e.searchLine(Mn), inFlight: [], receipt: null },
    [F]: {
      line: `- ${F}: say nothing this turn, only when the last landed entry is ${k} or ${X} and there is nothing new to say. Never when they just talked to you. Never on the unpaid turn after ${T}. Never on a ${k} outcome they have not heard.`,
      inFlight: [
        `Never ${F} on a turn they talked to you, even if a ${k} entry just landed.`,
        `${F} only when they have said nothing since your last line and the last thing that landed is a ${k} or ${X} entry and speaking would give them nothing new.`,
        `Never ${F} on the same turn as spoken words.`,
      ],
      receipt: `Do not ${F}.`,
    },
    [oe]: {
      line: `- ${oe}: hang up only on a parting greeting. Say your goodbye first; the line drops the moment you call it.`,
      inFlight: [],
      receipt: null,
    },
  };
};
var Wr =
    "what happens now: the job you are taking and what it is about, where the work stands and when you will say more, or the answer if you already have it. A confirmation on its own \u2014 okay, got it, sure, will do \u2014 is not a reply.",
  rl =
    "The job is under way. Keep talking with a natural question or a suggestion. Do not announce that you started.",
  fe = class e {
    static QUIET_WINDOW_SECONDS = 30;
    static ackLines() {
      return ["When a tool call will be quick, say nothing and invoke it."];
    }
    static receiptLines() {
      return [
        `${T} is never the quick path. Speak a short beat on this response that names the job in how you talk, then call it. Never start that beat with a confirmation. Never say you are calling the tool. Checking or fetching is not that beat.`,
        `A real errand that has to loop may ask the one or two things you would otherwise guess at; call ${T} anyway, and what they answer reaches the same job.`,
      ];
    }
    static voiceLoopLines(n = []) {
      return [
        "Starting something owes one short spoken beat on that same response before the tool, in your own words about the job. Never start that beat with a confirmation. Never say you are calling the tool, and it never needs saying twice.",
        `If ${T} left this response silent, keep talking on the next turn: a question, a suggestion, or a beat already on this call. Do not fill that beat with a start-status or silence.`,
        `If they talked to you, speak. A take, a recap, a story, a joke, small talk they asked for is done now; do not ask what kind first, do not ${T} it, and do not hold it for the errand.`,
        `Never re-announce you are still working within about ${e.QUIET_WINDOW_SECONDS} seconds of your last line.`,
        "Speak again for the outcome, a real step, a problem they need to hear, or anything they just said to you.",
        "A work update that only repeats a start you already named is not a turn.",
        "Never chase or poll the work; it reports back on its own.",
        "An empty tool result is not news. Do not announce quiet or that nothing came in.",
        ...me.inFlight(n),
      ];
    }
    static replyLines() {
      return [`When they spoke last, tell them ${Wr}`];
    }
    static continueLines(n) {
      return [
        "After you answer, keep the call going with one natural question, the way a person would: a follow-up, a suggestion, or whatever comes next.",
        "It does not have to be about the last line.",
        ...n,
      ];
    }
    static noInventedWorkLines() {
      return [
        "A follow-up is not invented work. Do not invent work, inbox items, or product facts that no tool and no real context on this call returned.",
      ];
    }
    static interruptedLines() {
      return [
        "When they talk over you, stop and listen; they heard only the start.",
        "If they have moved on, answer them; if they still want it, pick up where they cut you off without restarting the sentence.",
      ];
    }
    static queuedBehindCurrentWork() {
      return "This request is waiting behind work already on the call. It has not started. Say that in your own words, in one short line. Do not read this note out.";
    }
    static receiptTurnOwed(n = [], r = rl) {
      return [r, ...me.receipt(n)].join(" ");
    }
    static staySilentPlan(
      {
        theyJustTalked: n,
        newsOwed: r,
        receiptOwed: a,
        alreadySpokeThisTurn: s = !1,
      },
      y = ol,
    ) {
      return n
        ? { kind: "spoken", error: y.theyJustSpoke }
        : s
          ? { kind: "silent" }
          : r
            ? { kind: "spoken", error: y.newsOwed }
            : a
              ? { kind: "spoken", error: y.receiptOwed }
              : { kind: "silent" };
    }
  },
  ol = Object.freeze({
    theyJustSpoke: `They just spoke to you and have heard nothing back. Answer out loud, and tell them ${Wr} Do not stay_silent.`,
    newsOwed:
      "Work of yours just landed and they have not heard it. Say what it means out loud now.",
    receiptOwed: fe.receiptTurnOwed(De.of([F])),
  });
var al = {
  workSurfaces: "Files, the web, the browser, mail, chat, and their computer",
  dictation: { use: "quiz from that", notSent: "a deck" },
  factScope: "their world",
  missingFactMove: "try: send the job",
  inventedThings: "a screen, a page",
  narratedRead: "a page",
  inventedFiller: "inbox items or product incidents",
  sending: [
    `When they want something done or looked up that is not already on this call, call ${T}. The request is the job itself: what to do or find out, and what to come back with. Carry every explicit limit into the request, including lookup-only and anything they said not to do. Never their sentence with the question trimmed off. Keep their exact words only where the wording is part of the job \u2014 a name, a phrase to search for, a message to send \u2014 and say what to do with them. Never a recap of the chat.`,
  ],
  underWay: [
    `A change to a job already under way, stopping it included, is that same errand, changed: send the change through ${T}, and your one line says what the job is now, or that it is being stopped. Nothing new was started, so never say it was.`,
  ],
  notInChat: (e) => [
    `${e.textOnly} If they ask whether a sign-in card reached them, ${T} to verify it; a promise to provide a card is not evidence that it reached them.`,
    `When they ask for word from anyone else, their other agents included, the chat does not hold it: ${T} for it.`,
  ],
  speaking: [
    `A ${k} entry is the only work to speak. Never speak a ${X} entry.`,
  ],
  landing: [],
  noInventedWork: fe.noInventedWorkLines(),
  tools: {},
};
var VR = `${qe}:<call>`;
var Yr = [
    "sent",
    "sent_after_wait",
    "carried_by_live_response",
    "folded",
    "dropped_line_dead",
    "dropped_caller_holds",
    "dropped_caller_barged_in",
    "dropped_answered_live",
    "dropped_superseded",
    "dropped_call_closed",
  ],
  $r = ["outcome", "greeting", "steer", "bare"];
var il = [
    "unspecified",
    "none",
    "teamPrivacyMode",
    "teamSetupRequired",
    "teamAccessRequired",
    "notOffered",
    "freeTrialAvailable",
    "paywallIndividual",
    "paywallTeamMember",
    "paywallTeamAdmin",
  ],
  sl = "https://cursor.com/bot/onboarding",
  $T = `${sl}?step=share_data`;
var dl = new Set(il);
function qr(e) {
  return typeof e == "string" && dl.has(e);
}
var Fn = [
  "message",
  "tool-call",
  "send-message",
  "user-attachment",
  "notice",
  "event",
  "feedback",
  "voice-call",
  "mcp-app",
];
var Xr = ["ready", "superseded", "failed"],
  zr = ["entered", "retry", "recovered", "waking"],
  Jr = ["started", "recovered", "exhausted", "refused"],
  Zr = ["waking", "first_load_retry"],
  Qr = ["retry", "recover", "reset", "relaunch"],
  eo = ["update", "reset", "recover", "reconnecting"],
  no = ["taking-longer", "unreachable"],
  to = ["shown", "keep_waiting", "retry"],
  ro = ["roster", "transcript"],
  oo = ["covered", "superseded", "abandoned"],
  ao = ["dispatched", "retired", "parked", "failed"],
  io = ["queued", "prepared", "dispatching", "accepted-awaiting-echo"],
  so = ["install", "delta", "older-page"],
  lo = Fn,
  co = ["window-installed", "seed-in-flight", "server-tail"],
  uo = ["shadow-compare", "store-first", "server-tail"],
  po = ["blob", "omitted", "none"],
  yo = ["entered", "recovered"],
  So = [
    "wrong_account_suspected",
    "seat_revoked",
    "plan_expired",
    "no_plan",
    "unknown",
  ];
var mo = ["setup", "recreate"],
  fo = ["ready", "failed", "connectivity", "abandoned"],
  _o = [
    "cold_create",
    "first_connect",
    "manual_update",
    "manual_reset",
    "auto_update",
    "remote_reset",
    "reconnect",
  ],
  go = ["begin", "heartbeat", "end", "stage_transition"],
  Eo = ["foreground", "background"],
  Ao = ["acked", "failed", "timeout", "queued_offline"],
  Ro = ["landed", "timeout"],
  To = ["preview", "interactive"],
  ho = [
    "navigate",
    "dom_ready",
    "load_fail",
    "rfb_connect",
    "rfb_disconnect",
    "reconnect",
    "focus",
  ],
  Co = ["vnc", "composer", "pending"],
  bo = ["preview", "handoff", "teach"],
  Kn = ["success", "cancelled", "error"],
  Io = ["action_required", "bot_block", "pipeline", "agent"],
  No = ["user_form", "none"],
  Oo = ["assistant_text", "send_message", "tool_call"],
  ko = ["rendered", "timeout", "switched"],
  xo = ["turn_ended", "switched", "superseded", "timeout"],
  Do = ["footer_pill", "account_menu", "palette", "settings", "blocker"],
  Lo = ["shown", "clicked", "confirmed", "canceled", "refused_superseded"],
  Mo = ["check", "progress", "ready", "error", "disabled"],
  wo = ["clicked", "opened", "load_failed"],
  Po = ["document", "canvas"],
  vo = ["chat_card", "chat_link", "library", "page_link"],
  Uo = ["pointer", "focus", "key"],
  Vo = ["shown", "dismissed", "get_more_usage"],
  Bo = [
    "pin",
    "unpin",
    "move_to_section",
    "move_to_new_section",
    "mark_read",
    "mark_unread",
    "rename",
    "copy_link",
    "copy_conversation_id",
    "show_full_conversation",
    "show_async_tasks",
    "open_prompt_quality",
    "hide_from_sidebar",
    "unhide_from_sidebar",
    "delete",
    "replace_main_agent",
  ],
  Go = ["context_menu"];
var Fo = ["shell", "onboarding", "sign-in"],
  Ko = [
    "veto-seen",
    "veto-roster",
    "fresh",
    "fail-open-probes",
    "fail-open-deadline",
  ],
  Ho = ["seen-probe", "agent-probe", "deadline"],
  jo = [
    "meet",
    "computer-demo",
    "jobs",
    "role",
    "tools",
    "create",
    "notifications",
    "hand-off",
  ],
  Wo = ["forward", "back"],
  Yo = ["failed", "recovered"],
  $o = ["tick-failed", "run-failed"],
  qo = [
    "app",
    "chat_screen",
    "info_pane",
    "transcript_row",
    "mermaid",
    "other",
  ],
  _e = {
    nonceMismatch: "SAND-E0703",
    capabilityUnavailable: "SAND-E0704",
    hostRejected: "SAND-E0705",
    superseded: "SAND-E0706",
    ackExpired: "SAND-E0707",
  },
  ll = [
    "bot-templates.deleted-shares",
    "client-meta.account-slot",
    "cloud-agents.infos",
    "composer-drafts",
    "host-settings.onboarding",
    "roster.agent-avatars",
    "roster.last-roster",
    "selection.last-agent",
    "send-journal",
    "sidebar.last-sections",
    "transcript.replicas",
    "ui-agent-refs",
    "ui-layout",
    "usage-warning.dismissal",
    "weekly-usage.cache",
    "other",
  ],
  cl = new Set(ll);
function Xo(e) {
  return typeof e == "string" && cl.has(e);
}
var zo = [...Fn, "unknown-kind"],
  Jo = [
    "account-slot",
    "ui-state",
    "voice-settings",
    "cloud-agent-open-target",
    "cloud-agent-infos",
    "sidebar-sections",
    "last-selection",
    "last-roster",
    "transcript-replicas",
    "composer-drafts",
    "send-journal",
    "bot-templates",
  ],
  Zo = ["failed", "stuck"],
  Qo = ["settled", "cap", "ceiling"],
  ea = ["ok", "absent", "failed"],
  na = ["gmail", "google_drive", "other"],
  ta = ["button", "connected_pill", "admin_disabled_pill", "none"],
  ra = ["0", "1", "2", "3+"],
  oa = ["hover", "card", "row"],
  aa = [
    "cursor",
    "github",
    "gitlab",
    "azure",
    "slack",
    "notion",
    "public-web",
    "none",
  ],
  ia = ["fresh", "stale", "negative", "none"],
  sa = ["content", "empty", "unavailable", "failed", "closed_before_settle"];
var da = "box",
  la = "temporal";
var ul = 20,
  Rh = ul - 1;
function Hn(e, n) {
  let r = new Set(e);
  return (a) => {
    if (a !== void 0) return r.has(a) ? a : n;
  };
}
var pa = /^[0-9A-Za-z._/:|-]{1,64}$/;
var ca = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?",
  Ch = new RegExp(`^(?=.{1,253}$)${ca}(?:\\.${ca})*$`);
var pl = [200, 3276],
  bh = Math.max(...pl);
var yl = [
    "Canceled",
    "Unknown",
    "InvalidArgument",
    "DeadlineExceeded",
    "NotFound",
    "AlreadyExists",
    "PermissionDenied",
    "ResourceExhausted",
    "FailedPrecondition",
    "Aborted",
    "OutOfRange",
    "Unimplemented",
    "Internal",
    "Unavailable",
    "DataLoss",
    "Unauthenticated",
  ],
  Sl = "Other",
  Ih = Hn(yl, Sl),
  en = [
    "ECONNREFUSED",
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EPIPE",
    "ENETRESET",
    "ENETDOWN",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "EHOSTDOWN",
    "EAI_AGAIN",
    "ENOTFOUND",
    "EADDRINUSE",
    "EACCES",
    "EPERM",
    "ENOENT",
    "ENOSPC",
    "EDQUOT",
    "EROFS",
    "EBUSY",
    "EMFILE",
    "EIO",
  ],
  jn = "E_OTHER",
  Nh = Hn(en, jn),
  ua = [
    "Error",
    "TypeError",
    "AbortError",
    "DeadlineExceededError",
    "ConnectError",
  ],
  ml = [
    "client-paused",
    "away-park",
    "present-park",
    "dev-induced-offline",
    "network-return",
    "unknown",
    "cold_create",
    "first_connect",
    "manual_update",
    "manual_reset",
    "auto_update",
    "remote_reset",
    "reconnect",
    ...ua,
    ...ua.flatMap((e) => en.map((n) => `${e}/${n}`)),
  ],
  Oh = Hn(ml, "unknown");
var ya = ["none", "single", "double"];
var Wn = {
  headerName: "x-automation-failure-hint",
  values: {
    ANYSPHERE_REPO_MODEL_BLOCKED: "ANYSPHERE_REPO_MODEL_BLOCKED",
    BRANCH_NOT_FOUND: "BRANCH_NOT_FOUND",
    CLOUD_AGENTS_DISABLED: "CLOUD_AGENTS_DISABLED",
    CLOUD_AGENT_PLAN_RESTRICTED: "CLOUD_AGENT_PLAN_RESTRICTED",
    CLOUD_AGENT_STORAGE_DISABLED: "CLOUD_AGENT_STORAGE_DISABLED",
    CONCURRENT_LIMIT_EXCEEDED: "CONCURRENT_LIMIT_EXCEEDED",
    DUAL_MODEL_FIELDS: "DUAL_MODEL_FIELDS",
    ENVIRONMENT_ACCESS_DENIED: "ENVIRONMENT_ACCESS_DENIED",
    ENVIRONMENT_PIN_INVALID: "ENVIRONMENT_PIN_INVALID",
    ENVIRONMENT_REPO_REVERSE_MIRRORED: "ENVIRONMENT_REPO_REVERSE_MIRRORED",
    ENVIRONMENT_SETUP_SOURCE_RESTRICTED: "ENVIRONMENT_SETUP_SOURCE_RESTRICTED",
    FORCE_VM_BACKEND_NOT_ALLOWED: "FORCE_VM_BACKEND_NOT_ALLOWED",
    FREE_OWNER_CLOUD_AGENT_DENIED: "FREE_OWNER_CLOUD_AGENT_DENIED",
    INLINE_MCP_CONFIG_INVALID: "INLINE_MCP_CONFIG_INVALID",
    INLINE_MCP_CONFIG_POLICY_DENIED: "INLINE_MCP_CONFIG_POLICY_DENIED",
    INVALID_TEAM_ID: "INVALID_TEAM_ID",
    MODEL_BLOCKED: "MODEL_BLOCKED",
    MULTI_MODEL_DISABLED: "MULTI_MODEL_DISABLED",
    MULTI_REPO_LIMIT_EXCEEDED: "MULTI_REPO_LIMIT_EXCEEDED",
    NAMED_AGENT_SINGLE_SESSION: "NAMED_AGENT_SINGLE_SESSION",
    NO_REPO_AGENTS_DISABLED: "NO_REPO_AGENTS_DISABLED",
    PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
    PRIVATE_WORKERS_DISABLED: "PRIVATE_WORKERS_DISABLED",
    REMOTE_CONTROL_DISABLED: "REMOTE_CONTROL_DISABLED",
    REPO_ACCESS_DENIED: "REPO_ACCESS_DENIED",
    REPO_CONFIG_INVALID: "REPO_CONFIG_INVALID",
    REPO_EMPTY: "REPO_EMPTY",
    SAND_BOX_BLOCKED: "SAND_BOX_BLOCKED",
    SAND_CLIENT_UPDATE_REQUIRED: "SAND_CLIENT_UPDATE_REQUIRED",
    SCM_INSTALLATION_DENIED: "SCM_INSTALLATION_DENIED",
    SCM_NOT_CONNECTED: "SCM_NOT_CONNECTED",
    SERVICE_ACCOUNT_TEAM_CONTEXT_MISSING:
      "SERVICE_ACCOUNT_TEAM_CONTEXT_MISSING",
    SERVICE_RATE_LIMIT_EXCEEDED: "SERVICE_RATE_LIMIT_EXCEEDED",
    SYNTHESIS_NOT_ENABLED: "SYNTHESIS_NOT_ENABLED",
    TEAM_CLOUD_AGENT_ACCESS_DENIED: "TEAM_CLOUD_AGENT_ACCESS_DENIED",
    TEAM_INACTIVE: "TEAM_INACTIVE",
    TEAM_PRIVACY_MODE_UNCONFIGURED: "TEAM_PRIVACY_MODE_UNCONFIGURED",
    UNAUTHENTICATED_REPO_ACCESS: "UNAUTHENTICATED_REPO_ACCESS",
    USAGE_LIMIT_EXCEEDED: "USAGE_LIMIT_EXCEEDED",
    USER_BLOCKED: "USER_BLOCKED",
  },
};
var Sa = [
  "ok",
  "refused",
  "timeout",
  "http_5xx",
  "dns",
  "no_storage",
  "access_denied",
  "box_blocked",
  "network",
  "pod_hibernated",
];
var Vh = Wn.values.CLOUD_AGENT_STORAGE_DISABLED;
var Bh = Wn.values.SAND_BOX_BLOCKED;
var ma = ["loopback", "pod_proxy", "unknown"],
  fa = ["dev4", "us8"],
  _a = ["resolved", "not_found", "temporary_failure", "timeout", "error"],
  ga = [
    "system_path_failure",
    "independent_path_failure",
    "endpoint_failure",
    "cursorvm_failure",
    "general_dns_failure",
    "resolved_before_probe",
    "inconclusive",
  ],
  Ea = ["not_found", "temporary_failure", "unknown"];
var Aa = ["private", "team", "public", "unknown"];
var Xh = 8 * 1024;
var _l = {
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  },
  gl = { ".heic": "image/heic", ".heif": "image/heif" },
  Ra = { ..._l, ...gl };
var Ta = {
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
};
var ha = {
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".oga": "audio/ogg",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".weba": "audio/webm",
};
var Ca = [
    "image",
    "video",
    "audio",
    "pdf",
    "markdown",
    "html",
    "text",
    "json",
    "table",
    "docx",
    "unknown",
  ],
  oC = new Set(Object.keys(Ra).map((e) => e.slice(1))),
  aC = new Set(Object.keys(Ta).map((e) => e.slice(1))),
  iC = new Set(Object.keys(ha).map((e) => e.slice(1)));
var ba = /^[0-9A-Za-z.+-]{1,64}$/;
function Ia(e) {
  return e === "stable" || e === "nightly" || e === "dogfood";
}
var El = "tool_serve",
  Al = "relay",
  Na = [El, Al],
  Oa = ["nudge", "recall", "hangup", "silent", "unknown"];
var ka = "memo";
var Rl = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
  Tl = new RegExp(`^${ka}-${Rl}$`, "i"),
  hl = ka.length + 37;
function ge(e) {
  return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function Cl(e) {
  if (
    typeof e != "object" ||
    e === null ||
    Array.isArray(e) ||
    !("memo_id" in e) ||
    typeof e.memo_id != "string" ||
    e.memo_id.length !== hl ||
    !Tl.test(e.memo_id) ||
    !("telemetry_version" in e) ||
    e.telemetry_version !== "1" ||
    !("phase" in e)
  )
    return;
  let n = { memo_id: e.memo_id, telemetry_version: e.telemetry_version };
  switch (e.phase) {
    case "offered":
      return { ...n, phase: e.phase };
    case "started":
      return !("attempt" in e) ||
        !ge(e.attempt) ||
        e.attempt < 1 ||
        !("warmth" in e) ||
        (e.warmth !== "cold" && e.warmth !== "warming" && e.warmth !== "ready")
        ? void 0
        : { ...n, phase: e.phase, attempt: e.attempt, warmth: e.warmth };
    case "first_audio":
      return !("ttfa_ms" in e) || !ge(e.ttfa_ms)
        ? void 0
        : { ...n, phase: e.phase, ttfa_ms: e.ttfa_ms };
    case "seek":
      return !("sequence" in e) || !ge(e.sequence) || e.sequence < 1
        ? void 0
        : { ...n, phase: e.phase, sequence: e.sequence };
    case "transcript":
      return !("action" in e) ||
        (e.action !== "expanded" && e.action !== "collapsed")
        ? void 0
        : { ...n, phase: e.phase, action: e.action };
    case "ended":
      return !("outcome" in e) ||
        (e.outcome !== "completed" &&
          e.outcome !== "stopped" &&
          e.outcome !== "preempted" &&
          e.outcome !== "navigated" &&
          e.outcome !== "superseded" &&
          e.outcome !== "failed" &&
          e.outcome !== "not_entitled" &&
          e.outcome !== "disposed") ||
        !("heard_audio" in e) ||
        typeof e.heard_audio != "boolean" ||
        !("listened_ms" in e) ||
        !ge(e.listened_ms) ||
        !("audio_ms" in e) ||
        !ge(e.audio_ms) ||
        e.listened_ms > e.audio_ms ||
        !("elapsed_ms" in e) ||
        !ge(e.elapsed_ms)
        ? void 0
        : {
            ...n,
            phase: e.phase,
            outcome: e.outcome,
            heard_audio: e.heard_audio,
            listened_ms: e.listened_ms,
            audio_ms: e.audio_ms,
            elapsed_ms: e.elapsed_ms,
          };
    case "fault":
      return !("fault_kind" in e) ||
        (e.fault_kind !== "synthesis" &&
          e.fault_kind !== "playback" &&
          e.fault_kind !== "prefetch" &&
          e.fault_kind !== "empty_text" &&
          e.fault_kind !== "dictation_active" &&
          e.fault_kind !== "call_active" &&
          e.fault_kind !== "not_entitled")
        ? void 0
        : { ...n, phase: e.phase, fault_kind: e.fault_kind };
    default:
      return;
  }
}
function xa(e) {
  let n = Cl(e);
  return (
    n !== void 0 &&
    typeof e == "object" &&
    e !== null &&
    Object.keys(e).length === Object.keys(n).length &&
    Object.keys(n).every((r) => Object.hasOwn(e, r))
  );
}
var bl = [
    "engineering",
    "design",
    "marketing",
    "customer-support",
    "product",
    "ops-finance",
    "recruiting-people",
    "sales",
    "productivity",
  ],
  Il = new Set(bl);
function Da(e) {
  return Il.has(e);
}
var Yn = [
    "workspace",
    "slack",
    "notion",
    "salesforce",
    "microsoft-365",
    "linkedin",
    "zoom",
    "github",
    "cursor",
    "jira",
    "figma",
    "hubspot",
    "canva",
    "trello",
    "monday",
    "clickup",
    "intercom",
    "zendesk",
    "box",
    "dropbox",
    "docusign",
    "calendly",
    "loom",
    "outreach",
    "salesloft",
    "apollo",
    "clay",
    "zoominfo",
    "nooks",
    "stripe",
    "shopify",
    "quickbooks",
    "netsuite",
    "ramp",
    "workday",
    "rippling",
    "ashby",
    "greenhouse",
    "vercel",
    "tableau",
    "hex",
    "amplitude",
    "mixpanel",
    "snowflake",
    "databricks",
    "mailchimp",
  ],
  Nl = new Set(Yn);
function La(e) {
  return Nl.has(e);
}
var Ol = ["fatal", "error", "warning", "log", "info", "debug"];
var kl = /^<REDACTED: [A-Za-z ,-]+>$/,
  xl = /^[A-Za-z0-9._:@-]+$/;
var TC = new Set(Ol);
function Dl(e, n = 128) {
  if (!(typeof e != "string" || e.length === 0 || e.length > n))
    return xl.test(e) ? e : void 0;
}
function Ll(e) {
  let n = Dl(e);
  if (n !== void 0) return wl(n) === n ? n : void 0;
}
function nn(e) {
  return Ll(e) !== void 0;
}
var Ml = [
  { label: "Google API Key", regex: /AIza[A-Za-z0-9_\\\-]{35}/ },
  { label: "Slack Token", regex: /xox[pbar]\-[A-Za-z0-9]/ },
  {
    label: "GitHub Token",
    regex:
      /(gh[psuro]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/,
  },
  {
    label: "Generic Secret",
    regex:
      /(key|token|sig|secret|signature|password|passwd|pwd|android:value)[^a-zA-Z0-9]/i,
  },
  {
    label: "CLI Credentials",
    regex:
      /((login|psexec|(certutil|psexec)\.exe).{1,50}(\s-u(ser(name)?)?\s+.{3,100})?\s-(admin|user|vm|root)?p(ass(word)?)?\s+["']?[^$\-\/\s]|(^|[\s\r\n\\])net(\.exe)?.{1,5}(user\s+|share\s+\/user:| user -? secrets ? set) \s + [^ $\s \/])/,
  },
  {
    label: "Microsoft Entra ID",
    regex: /eyJ(?:0eXAiOiJKV1Qi|hbGci|[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.)/,
  },
  { label: "Email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
];
function wl(e) {
  if (!e || kl.test(e)) return e;
  for (let { label: n, regex: r } of Ml)
    if (r.test(e)) return `<REDACTED: ${n}>`;
  return e;
}
var Ma = ["chat", "agent-exchange"],
  wa = ["install", "cards", "boundary", "edge", "prepend", "live"],
  Pa = ["in_view", "off_screen", "unknown"],
  va = ["pinned", "scrolled_up", "unknown"],
  tn = [
    "entry:message",
    "entry:send-message",
    "entry:event",
    "entry:notice",
    "entry:feedback",
    "entry:voice-call",
    "entry:user-attachment",
    "entry:spend-initiation",
    "entry:other",
    "timestamp",
    "unread-divider",
    "widget-prompt",
    "attachment-group",
    "agent-comm-group",
    "routine-event-group",
    "cloud-agent-group",
    "other",
  ],
  bC = new Set(tn);
var Ua = [
  "Error",
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "EvalError",
  "URIError",
  "AggregateError",
  "SandInvariantViolation",
  "other",
];
function f(e) {
  return typeof e == "number" && Number.isFinite(e) && e >= 0;
}
function L(e) {
  return e === void 0 || f(e);
}
function g(e) {
  return e === void 0 || typeof e == "string";
}
function Y(e) {
  return e === void 0 || typeof e == "boolean";
}
function Ee(e) {
  return typeof e == "number" && Number.isInteger(e) && e >= 1;
}
function J(e) {
  return typeof e == "number" && Number.isInteger(e) && e >= 0;
}
function Le(e, n) {
  return typeof e == "string" && e.length > 0 && e.length <= n;
}
var Ul = new Set(Xr),
  Ka = {
    durationMs: !0,
    openRpcMs: !0,
    queueMs: !0,
    renderMs: !0,
    cold: !0,
    stale: !0,
    boxState: !0,
    outcome: !0,
  };
function Ha(e) {
  return l(e)
    ? f(e.durationMs) &&
        L(e.openRpcMs) &&
        L(e.queueMs) &&
        L(e.renderMs) &&
        typeof e.cold == "boolean" &&
        Y(e.stale) &&
        typeof e.boxState == "string" &&
        typeof e.outcome == "string" &&
        Ul.has(e.outcome)
    : !1;
}
var Vl = new Set(yo),
  Bl = new Set(So),
  ja = { edge: !0, cause: !0, accessReason: !0, msBlocked: !0 };
function Wa(e) {
  return l(e)
    ? typeof e.edge == "string" &&
        Vl.has(e.edge) &&
        typeof e.cause == "string" &&
        Bl.has(e.cause) &&
        qr(e.accessReason) &&
        L(e.msBlocked)
    : !1;
}
var Gl = new Set(zr),
  Fl = new Set(Jr),
  Kl = new Set(Zr),
  Ya = {
    phase: !0,
    isManual: !0,
    errorClass: !0,
    msSinceLastReachedMs: !0,
    outcome: !0,
    reason: !0,
    durationMs: !0,
    heldMs: !0,
  };
function $a(e) {
  return l(e)
    ? typeof e.phase == "string" &&
        Gl.has(e.phase) &&
        typeof e.isManual == "boolean" &&
        g(e.errorClass) &&
        L(e.msSinceLastReachedMs) &&
        (e.outcome === void 0 ||
          (typeof e.outcome == "string" && Fl.has(e.outcome))) &&
        (e.reason === void 0 ||
          (typeof e.reason == "string" && Kl.has(e.reason))) &&
        L(e.durationMs) &&
        L(e.heldMs)
    : !1;
}
var Hl = new Set(Qr),
  jl = /^[a-z0-9_]{1,64}$/i,
  qa = { action: !0, failureClass: !0, consecutiveIdentical: !0 };
function Xa(e) {
  return l(e)
    ? typeof e.action == "string" &&
        Hl.has(e.action) &&
        typeof e.failureClass == "string" &&
        jl.test(e.failureClass) &&
        Ee(e.consecutiveIdentical)
    : !1;
}
var Wl = new Set(eo),
  Yl = new Set(no),
  $l = new Set(to),
  ql = {
    escalation: {
      kind: !0,
      action: !0,
      escalation: !0,
      rebuildKind: !0,
      elapsedMs: !0,
    },
    pending_stall: {
      kind: !0,
      rebuildKind: !0,
      hasAck: !0,
      streamAttached: !0,
      elapsedMs: !0,
    },
  },
  za = (e) => ql[e.kind];
function Ja(e) {
  return !l(e) ||
    typeof e.rebuildKind != "string" ||
    !Wl.has(e.rebuildKind) ||
    !f(e.elapsedMs)
    ? !1
    : e.kind === "escalation"
      ? typeof e.action == "string" &&
        $l.has(e.action) &&
        typeof e.escalation == "string" &&
        Yl.has(e.escalation)
      : e.kind === "pending_stall"
        ? typeof e.hasAck == "boolean" && typeof e.streamAttached == "boolean"
        : !1;
}
var Xl = new Set(ro),
  zl = new Set(oo),
  Jl = new Set(ao),
  Zl = new Set(io),
  Ql = new Set(uo),
  ec = new Set(co),
  nc = new Set(so),
  tc = new Set([da, la]),
  rc = new Set(lo);
function oc(e) {
  return l(e)
    ? f(e.gatewayEntries) &&
        f(e.storeEntries) &&
        f(e.matched) &&
        f(e.mismatched) &&
        f(e.missing) &&
        f(e.extra) &&
        f(e.staleTail) &&
        typeof e.readReason == "string" &&
        Ql.has(e.readReason) &&
        typeof e.painted == "boolean"
    : !1;
}
var ac = {
    replica_resync: {
      kind: !0,
      replica: !0,
      outcome: !0,
      attempts: !0,
      durationMs: !0,
      bufferOverflowed: !0,
      epochChanged: !0,
    },
    send_journal_restore: {
      kind: !0,
      outcome: !0,
      phase: !0,
      ageMs: !0,
      recordCount: !0,
    },
    transcript_store_parity: {
      kind: !0,
      agentId: !0,
      readReason: !0,
      painted: !0,
      gatewayEntries: !0,
      storeEntries: !0,
      matched: !0,
      mismatched: !0,
      missing: !0,
      extra: !0,
      staleTail: !0,
    },
    transcript_store_first_skip: { kind: !0, agentId: !0, skipReason: !0 },
    transcript_window_rows_hidden: {
      kind: !0,
      agentId: !0,
      reason: !0,
      harness: !0,
      rowKind: !0,
      hiddenRows: !0,
      twinIds: !0,
    },
  },
  Za = (e) => ac[e.kind];
function Qa(e) {
  return l(e)
    ? e.kind === "replica_resync"
      ? typeof e.replica == "string" &&
        Xl.has(e.replica) &&
        typeof e.outcome == "string" &&
        zl.has(e.outcome) &&
        f(e.attempts) &&
        f(e.durationMs) &&
        typeof e.bufferOverflowed == "boolean" &&
        typeof e.epochChanged == "boolean"
      : e.kind === "send_journal_restore"
        ? typeof e.outcome == "string" &&
          Jl.has(e.outcome) &&
          typeof e.phase == "string" &&
          Zl.has(e.phase) &&
          f(e.ageMs) &&
          f(e.recordCount)
        : e.kind === "transcript_store_parity"
          ? $(e.agentId) !== null && oc(e)
          : e.kind === "transcript_store_first_skip"
            ? $(e.agentId) !== null &&
              typeof e.skipReason == "string" &&
              ec.has(e.skipReason)
            : e.kind === "transcript_window_rows_hidden"
              ? $(e.agentId) !== null &&
                typeof e.reason == "string" &&
                nc.has(e.reason) &&
                typeof e.harness == "string" &&
                tc.has(e.harness) &&
                typeof e.rowKind == "string" &&
                rc.has(e.rowKind) &&
                f(e.hiddenRows) &&
                f(e.twinIds)
              : !1
    : !1;
}
var ic = new Set(mo),
  sc = new Set(go),
  dc = new Set(_o),
  lc = new Set(fo),
  cc = new Set(Eo);
function Me(e, n) {
  return e === void 0 || (typeof e == "string" && n.has(e));
}
var ei = {
  event: !0,
  phase: !0,
  trigger: !0,
  outcome: !0,
  operationId: !0,
  kind: !0,
  surface: !0,
  stage: !0,
  migrationPhase: !0,
  fromStage: !0,
  stageElapsedMs: !0,
};
function ni(e) {
  return l(e)
    ? typeof e.event == "string" &&
        ic.has(e.event) &&
        typeof e.phase == "string" &&
        sc.has(e.phase) &&
        Me(e.trigger, dc) &&
        Me(e.outcome, lc) &&
        g(e.operationId) &&
        g(e.kind) &&
        Me(e.surface, cc) &&
        g(e.stage) &&
        g(e.migrationPhase) &&
        g(e.fromStage) &&
        L(e.stageElapsedMs)
    : !1;
}
var ti = {
  durationMs: !0,
  commitMs: !0,
  attachmentCount: !0,
  isFork: !0,
  traceId: !0,
  spanId: !0,
  conversationId: !0,
};
function ri(e) {
  return l(e)
    ? f(e.durationMs) &&
        L(e.commitMs) &&
        f(e.attachmentCount) &&
        typeof e.isFork == "boolean" &&
        g(e.traceId) &&
        g(e.spanId) &&
        g(e.conversationId)
    : !1;
}
var uc = new Set(Ao),
  oi = {
    ackMs: !0,
    outcome: !0,
    enterEpochMs: !0,
    traceparent: !0,
    traceId: !0,
    spanId: !0,
    clientNonce: !0,
    conversationId: !0,
    isFork: !0,
    attachmentCount: !0,
    commitOffsetMs: !0,
    commitMs: !0,
    clientOnlineAtTimeout: !0,
    didReachDeadline: !0,
  };
function ai(e) {
  return l(e)
    ? f(e.ackMs) &&
        typeof e.outcome == "string" &&
        uc.has(e.outcome) &&
        f(e.enterEpochMs) &&
        g(e.traceparent) &&
        g(e.traceId) &&
        g(e.spanId) &&
        g(e.clientNonce) &&
        g(e.conversationId) &&
        typeof e.isFork == "boolean" &&
        f(e.attachmentCount) &&
        L(e.commitOffsetMs) &&
        L(e.commitMs) &&
        Y(e.clientOnlineAtTimeout) &&
        Y(e.didReachDeadline)
    : !1;
}
var pc = /^[0-9A-Za-z._-]{1,64}$/;
function rn(e) {
  return e === void 0 || (typeof e == "string" && pc.test(e));
}
var ii = {
  clientNonce: !0,
  conversationId: !0,
  enterEpochMs: !0,
  isFork: !0,
  attachmentCount: !0,
  hasMessageText: !0,
  traceId: !0,
  spanId: !0,
};
function si(e) {
  return l(e)
    ? typeof e.clientNonce == "string" &&
        e.clientNonce.length > 0 &&
        typeof e.conversationId == "string" &&
        f(e.enterEpochMs) &&
        typeof e.isFork == "boolean" &&
        f(e.attachmentCount) &&
        typeof e.hasMessageText == "boolean" &&
        g(e.traceId) &&
        g(e.spanId)
    : !1;
}
var yc = new Set(Kn),
  Sc = new Set(Io),
  mc = new Set(No),
  di = {
    outcome: !0,
    errorType: !0,
    errorCode: !0,
    registryCode: !0,
    errorDomain: !0,
    errorRetryable: !0,
    siteBlockFamily: !0,
    siteBlockConfidence: !0,
    userAction: !0,
    settleBasis: !0,
    reconnected: !0,
    durationMs: !0,
    clientNonce: !0,
    conversationId: !0,
    isFork: !0,
    traceId: !0,
    spanId: !0,
  };
function li(e) {
  return l(e)
    ? typeof e.outcome == "string" &&
        yc.has(e.outcome) &&
        (e.errorType === void 0 ||
          (typeof e.errorType == "string" && Sc.has(e.errorType))) &&
        rn(e.errorCode) &&
        rn(e.registryCode) &&
        rn(e.errorDomain) &&
        Y(e.errorRetryable) &&
        rn(e.siteBlockFamily) &&
        (e.siteBlockConfidence === void 0 ||
          e.siteBlockConfidence === "high" ||
          e.siteBlockConfidence === "low") &&
        typeof e.userAction == "string" &&
        mc.has(e.userAction) &&
        (e.settleBasis === "host" || e.settleBasis === "client") &&
        typeof e.reconnected == "boolean" &&
        f(e.durationMs) &&
        typeof e.clientNonce == "string" &&
        e.clientNonce.length > 0 &&
        typeof e.conversationId == "string" &&
        typeof e.isFork == "boolean" &&
        g(e.traceId) &&
        g(e.spanId)
    : !1;
}
var fc = new Set(Ro),
  ci = { ackMs: !0, outcome: !0, conversationId: !0, emoji: !0 };
function ui(e) {
  return l(e)
    ? f(e.ackMs) &&
        typeof e.outcome == "string" &&
        fc.has(e.outcome) &&
        Le(e.conversationId, 256) &&
        Le(e.emoji, 64)
    : !1;
}
var _c = new Set(To),
  gc = new Set(ho),
  Ec = new Set(Co),
  pi = {
    surface: !0,
    phase: !0,
    vncHost: !0,
    display: !0,
    durationMs: !0,
    sinceOpenMs: !0,
    failCode: !0,
    clean: !0,
    reused: !0,
    focusOwner: !0,
    focusLanded: !0,
  };
function yi(e) {
  return l(e)
    ? typeof e.surface == "string" &&
        _c.has(e.surface) &&
        typeof e.phase == "string" &&
        gc.has(e.phase) &&
        g(e.vncHost) &&
        g(e.display) &&
        L(e.durationMs) &&
        L(e.sinceOpenMs) &&
        g(e.failCode) &&
        Y(e.clean) &&
        Y(e.reused) &&
        Me(e.focusOwner, Ec) &&
        Y(e.focusLanded)
    : !1;
}
var Ac = new Set(bo),
  Si = { trigger: !0, hadVncUrl: !0, monitorFocused: !0 };
function mi(e) {
  return l(e)
    ? typeof e.trigger == "string" &&
        Ac.has(e.trigger) &&
        typeof e.hadVncUrl == "boolean" &&
        typeof e.monitorFocused == "boolean"
    : !1;
}
var Rc = new Set(ko),
  Tc = new Set(xo),
  hc = new Set(Oo),
  fi = {
    ttfrMs: !0,
    outcome: !0,
    chunkType: !0,
    enterEpochMs: !0,
    traceparent: !0,
    traceId: !0,
    spanId: !0,
    clientNonce: !0,
    conversationId: !0,
    isFork: !0,
  };
function _i(e) {
  return l(e)
    ? f(e.ttfrMs) &&
        typeof e.outcome == "string" &&
        Rc.has(e.outcome) &&
        Me(e.chunkType, hc) &&
        f(e.enterEpochMs) &&
        g(e.traceparent) &&
        g(e.traceId) &&
        g(e.spanId) &&
        g(e.clientNonce) &&
        g(e.conversationId) &&
        typeof e.isFork == "boolean"
    : !1;
}
var gi = {
  outcome: !0,
  chunkCount: !0,
  maxGapMs: !0,
  stalledMs: !0,
  stallCount: !0,
  streamMs: !0,
  traceId: !0,
  spanId: !0,
  clientNonce: !0,
  conversationId: !0,
  isFork: !0,
};
function Ei(e) {
  return l(e)
    ? typeof e.outcome == "string" &&
        Tc.has(e.outcome) &&
        f(e.chunkCount) &&
        f(e.maxGapMs) &&
        f(e.stalledMs) &&
        f(e.stallCount) &&
        f(e.streamMs) &&
        g(e.traceId) &&
        g(e.spanId) &&
        g(e.clientNonce) &&
        g(e.conversationId) &&
        typeof e.isFork == "boolean"
    : !1;
}
var Cc = new Set(Do),
  bc = new Set(Lo),
  Ic = new Set(Mo),
  Ai = { surface: !0, action: !0, kind: !0, targetVersion: !0 };
function Ri(e) {
  return l(e)
    ? typeof e.surface == "string" &&
        Cc.has(e.surface) &&
        typeof e.action == "string" &&
        bc.has(e.action) &&
        typeof e.kind == "string" &&
        Ic.has(e.kind) &&
        (e.targetVersion === void 0 ||
          (typeof e.targetVersion == "string" && ba.test(e.targetVersion)))
    : !1;
}
var Nc = new Set(Vo),
  Oc = new Set(ya),
  Ti = { action: !0, thresholdPercent: !0, policy: !0 };
function hi(e) {
  return l(e)
    ? typeof e.action == "string" &&
        Nc.has(e.action) &&
        typeof e.thresholdPercent == "number" &&
        Number.isFinite(e.thresholdPercent) &&
        e.thresholdPercent > 0 &&
        e.thresholdPercent < 100 &&
        typeof e.policy == "string" &&
        Oc.has(e.policy)
    : !1;
}
var kc = new Set(Ca),
  xc = new Set(wo),
  Ci = { stage: !0, agentId: !0, bcId: !0, kind: !0 };
function bi(e) {
  return l(e)
    ? typeof e.stage == "string" &&
        xc.has(e.stage) &&
        nn(e.agentId) &&
        nn(e.bcId) &&
        typeof e.kind == "string" &&
        kc.has(e.kind)
    : !1;
}
var Dc = new Set(Po),
  Lc = new Set(Uo),
  qn = new Set(vo),
  Mc = new Set(Aa),
  wc = {
    opened: {
      action: !0,
      ref: !0,
      surface: !0,
      inGroupChat: !0,
      ageMinutes: !0,
    },
    edit_attempted: {
      action: !0,
      ref: !0,
      surface: !0,
      inGroupChat: !0,
      canEdit: !0,
      trigger: !0,
    },
    edit_saved: { action: !0, ref: !0, surface: !0, inGroupChat: !0 },
    link_copied: { action: !0, ref: !0, visibility: !0 },
  };
function Pc(e) {
  return typeof e == "string" && e.trim().length > 0;
}
function vc(e) {
  if (!l(e) || typeof e.artifactType != "string" || !Dc.has(e.artifactType))
    return !1;
  let n =
      e.artifactType === "canvas"
        ? ["artifactType", "canvasId"]
        : ["artifactType", "storeId", "documentId"],
    r = Object.keys(e);
  return r.length !== n.length || !n.every((a) => r.includes(a))
    ? !1
    : n.every((a) => a === "artifactType" || Pc(e[a]));
}
var Ii = (e) => wc[e.action];
function Ni(e) {
  if (!l(e) || !vc(e.ref)) return !1;
  switch (e.action) {
    case "opened":
      return (
        typeof e.surface == "string" &&
        qn.has(e.surface) &&
        typeof e.inGroupChat == "boolean" &&
        (e.ageMinutes === null ||
          (typeof e.ageMinutes == "number" &&
            Number.isInteger(e.ageMinutes) &&
            e.ageMinutes >= 0))
      );
    case "edit_attempted":
      return (
        e.ref.artifactType === "document" &&
        typeof e.surface == "string" &&
        qn.has(e.surface) &&
        typeof e.inGroupChat == "boolean" &&
        typeof e.canEdit == "boolean" &&
        typeof e.trigger == "string" &&
        Lc.has(e.trigger)
      );
    case "edit_saved":
      return (
        e.ref.artifactType === "document" &&
        typeof e.surface == "string" &&
        qn.has(e.surface) &&
        typeof e.inGroupChat == "boolean"
      );
    case "link_copied":
      return typeof e.visibility == "string" && Mc.has(e.visibility);
    default:
      return !1;
  }
}
var Uc = new Set(Bo),
  Vc = new Set(Go),
  Oi = { action: !0, entrypoint: !0 };
function ki(e) {
  return l(e)
    ? typeof e.action == "string" &&
        Uc.has(e.action) &&
        typeof e.entrypoint == "string" &&
        Vc.has(e.entrypoint)
    : !1;
}
var xi = {
  searchId: !0,
  query: !0,
  resultCount: !0,
  pluginIds: !0,
  agentId: !0,
};
function Di(e) {
  if (!l(e)) return !1;
  let { query: n, pluginIds: r, resultCount: a } = e;
  return (
    Le(e.searchId, 128) &&
    typeof n == "string" &&
    n.length > 0 &&
    Array.from(n).length <= 200 &&
    Array.isArray(r) &&
    r.length <= 25 &&
    r.every((s) => Le(s, 128)) &&
    J(a) &&
    a >= r.length &&
    (e.agentId === void 0 || Le(e.agentId, 128))
  );
}
var Bc = new Set(Fo),
  Gc = new Set(Ko),
  Fc = new Set(Ho);
function Li(e) {
  return typeof e.gate == "string"
    ? "gate"
    : typeof e.stall == "string"
      ? "stall"
      : "consult";
}
var Kc = {
    gate: { gate: !0 },
    stall: { stall: !0, signedIn: !0 },
    consult: { consult: !0 },
  },
  Mi = (e) => Kc[Li(e)];
function wi(e) {
  if (!l(e)) return !1;
  switch (Li(e)) {
    case "gate":
      return typeof e.gate == "string" && Bc.has(e.gate);
    case "stall":
      return (
        typeof e.stall == "string" &&
        Fc.has(e.stall) &&
        (e.signedIn === null || typeof e.signedIn == "boolean")
      );
    case "consult":
      return typeof e.consult == "string" && Gc.has(e.consult);
  }
}
var Hc = new Set(jo),
  jc = new Set(Wo),
  Wc = 16,
  Pi = { step: !0, stepIndex: !0, direction: !0 };
function vi(e) {
  return l(e)
    ? typeof e.step == "string" &&
        Hc.has(e.step) &&
        typeof e.stepIndex == "number" &&
        Number.isInteger(e.stepIndex) &&
        e.stepIndex >= 0 &&
        e.stepIndex <= Wc &&
        typeof e.direction == "string" &&
        jc.has(e.direction)
    : !1;
}
var Ui = { role: !0, tools: !0 };
function Vi(e) {
  return !l(e) || !Array.isArray(e.tools) || e.tools.length > Yn.length
    ? !1
    : (e.role === void 0 || (typeof e.role == "string" && Da(e.role))) &&
        e.tools.every((n) => typeof n == "string" && La(n));
}
var Yc = /^[0-9A-Za-z._-]{1,128}$/,
  $c = new Set(Yo),
  qc = new Set($o),
  Xc = new Set(qo),
  zc = new Set([_e.nonceMismatch, _e.capabilityUnavailable, _e.hostRejected]),
  Jc = new Set([...en, jn]),
  Zc = new Set(zo),
  Qc = new Set(["transcript"]),
  eu = new Set(Ma),
  nu = new Set(wa),
  tu = new Set(Pa),
  ru = new Set(va),
  ou = new Set(tn),
  au = tn.length,
  iu = new Set(Ua),
  su = new Set(Dr),
  du = new Set(Na),
  lu = new Set(Oa),
  cu = new Set(Yr),
  uu = new Set($r),
  pu = new Set(Zo),
  yu = new Set([...Jo, "none"]),
  Su = new Set(Qo),
  mu = new Set(ea),
  fu = new Set(oa),
  _u = new Set(na),
  gu = new Set(ta),
  Eu = new Set(ra),
  Au = new Set(aa),
  Ru = new Set(ia),
  Tu = new Set(sa),
  hu = 256;
function K(e) {
  return typeof e == "string" && pa.test(e);
}
function ie(e) {
  return e === void 0 || K(e);
}
function Bi(e) {
  return e === void 0 || (typeof e == "string" && Yc.test(e));
}
function Va(e, n) {
  return l(e) && e.code === n;
}
function Ba(e) {
  if (!l(e) || e.code !== "SAND-E0701") return !1;
  let n = e.errno;
  return n === void 0 || (typeof n == "string" && Jc.has(n));
}
function Cu(e) {
  return l(e)
    ? K(e.domain) &&
        K(e.operation) &&
        typeof e.state == "string" &&
        $c.has(e.state) &&
        K(e.failureCode) &&
        K(e.boundary) &&
        ie(e.retryOwner) &&
        ie(e.transportKind) &&
        L(e.failedMs)
    : !1;
}
function bu(e) {
  return l(e)
    ? typeof e.boundary == "string" &&
        Xc.has(e.boundary) &&
        K(e.errorClass) &&
        Ee(e.occurrence)
    : !1;
}
function Iu(e) {
  return !l(e) || !f(e.queuedMs) || !f(e.queueDepth)
    ? !1
    : e.outcome === "delivered"
      ? e.cause === void 0
      : e.outcome === "superseded"
        ? e.cause === _e.superseded
        : e.outcome === "expired"
          ? e.cause === _e.ackExpired
          : e.outcome === "flush_failed" &&
            typeof e.cause == "string" &&
            zc.has(e.cause);
}
function Gi(e) {
  return l(e)
    ? (e.serverName === void 0 ||
        (typeof e.serverName == "string" && e.serverName.length <= hu)) &&
        ie(e.serverId)
    : !1;
}
function Ga(e) {
  return l(e) && Gi(e) && ie(e.cardId) && ie(e.agentId);
}
function Nu(e) {
  return !l(e) || !Xo(e.slice) || !L(e.bytes)
    ? !1
    : e.op === "writeback"
      ? e.outcome === "ok" && e.error === void 0 && e.bytes === void 0
      : e.op === "load"
        ? e.outcome === "ok"
          ? e.error === void 0
          : e.outcome === "corrupt"
            ? Va(e.error, "SAND-E0700")
            : e.outcome === "io_error" && Ba(e.error)
        : e.op !== "persist"
          ? !1
          : e.outcome === "quota"
            ? Va(e.error, "SAND-E0702")
            : e.outcome === "io_error" && Ba(e.error);
}
function Ou(e) {
  return l(e)
    ? typeof e.entryKind == "string" && Zc.has(e.entryKind) && Ee(e.occurrence)
    : !1;
}
function ku(e) {
  return (
    l(e) &&
    Object.keys(e).length === 3 &&
    (e.accountSlot === null ||
      (typeof e.accountSlot == "string" &&
        e.accountSlot.length > 0 &&
        e.accountSlot.length <= 512)) &&
    jr(e.event)
  );
}
function xu(e) {
  return l(e)
    ? typeof e.phase == "string" &&
        su.has(e.phase) &&
        K(e.callId) &&
        Bi(e.realtimeConversationId) &&
        f(e.elapsedMs) &&
        ie(e.errorClass) &&
        L(e.closeCode) &&
        Y(e.closeClean) &&
        Y(e.socketOpen) &&
        Y(e.sessionCreated) &&
        Y(e.micReady) &&
        L(e.beat)
    : !1;
}
function Du(e) {
  return l(e)
    ? typeof e.fault == "string" &&
        du.has(e.fault) &&
        typeof e.tool == "string" &&
        lu.has(e.tool) &&
        K(e.callId) &&
        Bi(e.realtimeConversationId) &&
        K(e.errorClass) &&
        ie(e.failureCode)
    : !1;
}
function Lu(e) {
  return l(e)
    ? typeof e.settlement == "string" &&
        cu.has(e.settlement) &&
        typeof e.carries == "string" &&
        uu.has(e.carries) &&
        K(e.callId)
    : !1;
}
function Mu(e) {
  return (
    l(e) &&
    Object.keys(e).length === 3 &&
    (e.accountSlot === null ||
      (typeof e.accountSlot == "string" &&
        e.accountSlot.length > 0 &&
        e.accountSlot.length <= 512)) &&
    xa(e.event)
  );
}
function Fa(e, n) {
  return !J(n) || n > au
    ? !1
    : n === 0
      ? e === void 0
      : typeof e == "string" && ou.has(e);
}
function wu(e) {
  return l(e)
    ? typeof e.surface == "string" &&
        eu.has(e.surface) &&
        typeof e.reason == "string" &&
        nu.has(e.reason) &&
        J(e.removedRows) &&
        J(e.insertedRows) &&
        e.removedRows + e.insertedRows > 0 &&
        Fa(e.removedKind, e.removedKindCount) &&
        Fa(e.insertedKind, e.insertedKindCount) &&
        J(e.rowsBefore) &&
        J(e.rowsAfter) &&
        typeof e.viewport == "string" &&
        tu.has(e.viewport) &&
        typeof e.scrollMode == "string" &&
        ru.has(e.scrollMode) &&
        Ee(e.occurrence)
    : !1;
}
function Pu(e) {
  return l(e)
    ? typeof e.pane == "string" &&
        Qc.has(e.pane) &&
        typeof e.errorClass == "string" &&
        iu.has(e.errorClass) &&
        Ee(e.occurrence)
    : !1;
}
function vu(e) {
  return (
    l(e) &&
    K(e.policyName) &&
    typeof e.reason == "string" &&
    qc.has(e.reason) &&
    K(e.errorClass)
  );
}
function Uu(e) {
  return l(e)
    ? typeof e.outcome == "string" &&
        pu.has(e.outcome) &&
        typeof e.stage == "string" &&
        yu.has(e.stage) &&
        ie(e.errorClass) &&
        Ee(e.generation) &&
        f(e.elapsedMs)
    : !1;
}
function Vu(e) {
  return l(e)
    ? Object.keys(e).length === 6 &&
        typeof e.reason == "string" &&
        Su.has(e.reason) &&
        f(e.heldMs) &&
        J(e.unsettledBodies) &&
        J(e.unsettledPlaceholders) &&
        J(e.cloudAgentCards)
    : !1;
}
function Bu(e) {
  return l(e)
    ? Object.keys(e).length === 4 &&
        typeof e.outcome == "string" &&
        mu.has(e.outcome) &&
        f(e.durationMs) &&
        typeof e.seeded == "boolean"
    : !1;
}
function ce(e, n) {
  return typeof n == "string" && e.has(n);
}
function Gu(e) {
  return l(e)
    ? Object.keys(e).length === 8 &&
        ce(_u, e.connector) &&
        ce(gu, e.headerAction) &&
        typeof e.handoffRow == "boolean" &&
        typeof e.labelInput == "boolean" &&
        typeof e.accountFooter == "boolean" &&
        typeof e.suggestions == "boolean" &&
        ce(Eu, e.accountRows)
    : !1;
}
function Fu(e) {
  return l(e)
    ? Object.keys(e).length === 7 &&
        ce(fu, e.surface) &&
        ce(Au, e.hostClass) &&
        ce(Ru, e.heldAtOpen) &&
        ce(Tu, e.outcome) &&
        f(e.waitMs) &&
        J(e.urlBytes)
    : !1;
}
var Ku = {
    client_resource: {
      kind: !0,
      domain: !0,
      operation: !0,
      state: !0,
      failureCode: !0,
      boundary: !0,
      retryOwner: !0,
      transportKind: !0,
      failedMs: !0,
    },
    policy_stopped: { kind: !0, policyName: !0, reason: !0, errorClass: !0 },
    renderer_boundary_caught: {
      kind: !0,
      boundary: !0,
      errorClass: !0,
      occurrence: !0,
    },
    send_queued_flush: {
      kind: !0,
      queuedMs: !0,
      queueDepth: !0,
      outcome: !0,
      cause: !0,
    },
    client_persistence: {
      kind: !0,
      op: !0,
      outcome: !0,
      slice: !0,
      bytes: !0,
      error: !0,
    },
    connector_auth_clicked: { kind: !0, serverName: !0, serverId: !0 },
    connector_card_shown: {
      kind: !0,
      serverName: !0,
      serverId: !0,
      cardId: !0,
      agentId: !0,
    },
    connector_card_clicked: {
      kind: !0,
      serverName: !0,
      serverId: !0,
      cardId: !0,
      agentId: !0,
    },
    unclaimed_card_key: { kind: !0, entryKind: !0, occurrence: !0 },
    pane_boundary: { kind: !0, pane: !0, errorClass: !0, occurrence: !0 },
    transcript_paint_rows_changed: {
      kind: !0,
      surface: !0,
      reason: !0,
      removedRows: !0,
      insertedRows: !0,
      removedKind: !0,
      removedKindCount: !0,
      insertedKind: !0,
      insertedKindCount: !0,
      rowsBefore: !0,
      rowsAfter: !0,
      viewport: !0,
      scrollMode: !0,
      occurrence: !0,
    },
    voice_call: { kind: !0, accountSlot: !0, event: !0 },
    voice_call_connect: {
      kind: !0,
      phase: !0,
      callId: !0,
      realtimeConversationId: !0,
      elapsedMs: !0,
      errorClass: !0,
      closeCode: !0,
      closeClean: !0,
      socketOpen: !0,
      sessionCreated: !0,
      micReady: !0,
      beat: !0,
    },
    voice_call_fault: {
      kind: !0,
      fault: !0,
      tool: !0,
      callId: !0,
      realtimeConversationId: !0,
      errorClass: !0,
      failureCode: !0,
    },
    voice_call_delivery: { kind: !0, settlement: !0, carries: !0, callId: !0 },
    voice_memo: { kind: !0, accountSlot: !0, event: !0 },
    client_restore: {
      kind: !0,
      outcome: !0,
      stage: !0,
      errorClass: !0,
      generation: !0,
      elapsedMs: !0,
    },
    transcript_first_layout: {
      kind: !0,
      reason: !0,
      heldMs: !0,
      unsettledBodies: !0,
      unsettledPlaceholders: !0,
      cloudAgentCards: !0,
    },
    cloud_agent_info_read: {
      kind: !0,
      outcome: !0,
      durationMs: !0,
      seeded: !0,
    },
    connector_card_rendered: {
      kind: !0,
      connector: !0,
      headerAction: !0,
      handoffRow: !0,
      labelInput: !0,
      accountFooter: !0,
      suggestions: !0,
      accountRows: !0,
    },
    chip_first_content: {
      kind: !0,
      surface: !0,
      hostClass: !0,
      heldAtOpen: !0,
      outcome: !0,
      waitMs: !0,
      urlBytes: !0,
    },
  },
  Fi = (e) => Ku[e.kind];
function Ki(e) {
  return l(e)
    ? e.kind === "client_resource"
      ? Cu(e)
      : e.kind === "policy_stopped"
        ? vu(e)
        : e.kind === "renderer_boundary_caught"
          ? bu(e)
          : e.kind === "send_queued_flush"
            ? Iu(e)
            : e.kind === "client_persistence"
              ? Nu(e)
              : e.kind === "connector_auth_clicked"
                ? Gi(e)
                : e.kind === "connector_card_shown" ||
                    e.kind === "connector_card_clicked"
                  ? Ga(e)
                  : e.kind === "unclaimed_card_key"
                    ? Ou(e)
                    : e.kind === "pane_boundary"
                      ? Pu(e)
                      : e.kind === "transcript_paint_rows_changed"
                        ? wu(e)
                        : e.kind === "voice_call"
                          ? ku(e)
                          : e.kind === "voice_call_connect"
                            ? xu(e)
                            : e.kind === "voice_call_fault"
                              ? Du(e)
                              : e.kind === "voice_call_delivery"
                                ? Lu(e)
                                : e.kind === "voice_memo"
                                  ? Mu(e)
                                  : e.kind === "client_restore"
                                    ? Uu(e)
                                    : e.kind === "transcript_first_layout"
                                      ? Vu(e)
                                      : e.kind === "cloud_agent_info_read"
                                        ? Bu(e)
                                        : e.kind === "chip_first_content"
                                          ? Fu(e)
                                          : e.kind === "connector_card_rendered"
                                            ? Gu(e)
                                            : !1
    : !1;
}
var Hi = { agentId: !0 };
function ji(e) {
  return l(e) ? e.agentId === null || nn(e.agentId) : !1;
}
var qC = new Set(po);
var XC = new Set(Sa),
  zC = new Set(ma),
  JC = new Set(fa),
  ZC = new Set(_a),
  QC = new Set(ga),
  eb = new Set(Ea);
var on = "/grok-bot/passkey/",
  ob = 5 * 6e4;
var Hu = /^[A-Za-z0-9._-]+$/;
function Wi(e) {
  if (!e.startsWith(on)) return !1;
  let n = e.slice(on.length).split("/");
  return (
    n.at(-1) === "" && n.pop(),
    n.length === 0 || !n.every((r) => Hu.test(r) && r !== "." && r !== "..")
      ? !1
      : new URL(e, "https://ceremony.invalid").pathname === e
  );
}
var ju = ["always", "ask", "never"];
function Yi(e) {
  return typeof e == "string" && ju.includes(e);
}
var Wu = [
  "run-command",
  "send-input",
  "read-file",
  "list-directory",
  "write-file",
  "read-ai-tool-setup",
  "read-messages",
  "send-imessage",
  "run-phone-tool",
];
function we(e) {
  return typeof e == "string" && Wu.includes(e);
}
var Xn = ["spend-initiation", "error"],
  fb = new Set(Xn);
var Yu = ["tool-call", "user-attachment", "mcp-app", ...Xn],
  Nb = new Set(Yu);
function $i(e) {
  return typeof e == "number" && Number.isFinite(e) && e >= 0;
}
var $u = [
  "open-failed",
  "load-failed",
  "shadow-compare",
  "store-first",
  "server-tail",
];
function qi(e) {
  if (typeof e != "object" || e == null) return !1;
  let n = e;
  return (
    $(n.agentId) !== null &&
    Number.isInteger(n.limit) &&
    n.limit > 0 &&
    (n.sessionId === void 0 || typeof n.sessionId == "string") &&
    (n.unreadBoundaryAt === void 0 || $i(n.unreadBoundaryAt)) &&
    $u.includes(n.reason)
  );
}
var qu = new Set(["post_connect"]);
function Pe(e) {
  return typeof e == "number" && Number.isFinite(e) && e >= 0;
}
var Xi = {
  phase: !0,
  stallMs: !0,
  keys: !0,
  clicks: !0,
  moves: !0,
  inBytes: !0,
};
function zi(e) {
  return l(e)
    ? typeof e.phase == "string" &&
        qu.has(e.phase) &&
        Pe(e.stallMs) &&
        Pe(e.keys) &&
        Pe(e.clicks) &&
        Pe(e.moves) &&
        Pe(e.inBytes)
    : !1;
}
var Ae = { enabled: S() },
  zu = _("JSON value", be),
  Ju = _("IANA time zone", (e) => typeof e == "string" && Ne(e)),
  Zu = _(`relative path under ${on}`, (e) => typeof e == "string" && Wi(e)),
  Qu = _(`${6}-digit enrollment code`, ur),
  ep = _(
    "positive integer",
    (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0,
  ),
  Ji = _(
    "non-negative whole cents",
    (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0,
  ),
  np = _(
    "non-negative int32 dollars",
    (e) =>
      typeof e == "number" &&
      Number.isSafeInteger(e) &&
      e >= 0 &&
      e <= 2147483647,
  ),
  zn = R(p({ kind: u("personal") }), p({ kind: u("team"), teamId: ep })),
  an = d(A(i())),
  tp = p({
    connectDomains: an,
    resourceDomains: an,
    frameDomains: an,
    baseUriDomains: an,
  }),
  Zi = A(p({ path: c, content: i() })),
  rp = R(
    p({
      accountUuid: m,
      vaultName: m,
      accountUrl: d(i()),
      accountEmail: d(i()),
      connectionId: d(m),
    }),
    p({ serviceAccountToken: m, connectionId: d(m) }),
  ),
  Qi = d(R(u("box"), u("temporal"))),
  es = R(u("profile_menu"), u("settings")),
  op = ne("non-empty audio bytes", (e) => {
    let n = null;
    return (
      e instanceof Uint8Array
        ? (n = e)
        : e instanceof ArrayBuffer && (n = new Uint8Array(e)),
      n == null || n.length === 0 ? { success: !1 } : { success: !0, data: n }
    );
  }),
  ap = ne("profile photo: PNG, JPEG, or WebP bytes of at most 2 MB", (e) => {
    if (!l(e)) return { success: !1 };
    let { contentType: n, bytes: r } = e;
    return typeof n != "string" ||
      !kn(n) ||
      !(r instanceof Uint8Array) ||
      cr({ contentType: n, byteLength: r.byteLength }) !== null
      ? { success: !1 }
      : { success: !0, data: { contentType: n, bytes: r } };
  }),
  ip = _(
    `non-blank text of at most ${xn} characters`,
    (e) => typeof e == "string" && Or(e) === "ok",
  ),
  ns = _("computer upgrade schedule args (local time, IANA time zone)", Er),
  sp = ne("feedback report", (e) => {
    let n = br(e);
    return n === null ? { success: !1 } : { success: !0, data: n };
  }),
  dp = _(
    "caller name: string, null, or absent",
    (e) => e == null || typeof e == "string",
  ),
  sn = R(
    p({ kind: u("store"), storeId: i(), canvasId: i() }),
    p({ kind: u("active-user-store"), canvasId: i() }),
  ),
  lp = R(u("private"), u("team-view"), u("public")),
  Jn = R(u("auto_review"), u("always_allow"), u("needs_approval")),
  cp = p({
    serverId: c,
    tools: de(R(Jn, u("blocked"))),
    reads: d(Jn),
    writes: d(Jn),
  }),
  ve = p({ storeId: i(), documentId: i() }),
  up = R(u("private"), u("team-view")),
  ts = ne("canvas id (bare UUID)", (e) => {
    if (typeof e != "string") return { success: !1 };
    let n = On(e);
    return n.ok ? { success: !0, data: n.value } : { success: !1 };
  }),
  pp = R(
    p({ kind: u("canvas"), storeId: m, canvasId: ts }),
    p({ kind: u("active-user-store-canvas"), canvasId: ts }),
    p({
      kind: u("document"),
      storeId: m,
      documentId: _("document id", (e) => typeof e == "string" && gr(e)),
    }),
  ),
  rs = R(
    p({ kind: u("backend") }),
    p({
      kind: u("package"),
      loop: R(u("box"), u("temporal")),
      hasStaySilent: S(),
      hasOverheard: S(),
    }),
  ),
  os = Ce("main", {
    methods: {
      openExternal: t().args({ url: i() }),
      openCanvasLink: t().args({ url: i() }),
      getCanvasShare: t().args({ locator: sn }),
      setCanvasVisibility: t().args({ locator: sn, visibility: lp }),
      setCanvasPageAddress: t().args({ locator: sn, slug: c }),
      renameCanvas: t().args({ locator: sn, title: m }),
      getDocument: t().args({ locator: ve, groupChatId: d(m) }),
      getDocumentEditRight: t().args({ locator: ve }),
      saveDocument: t().args({ locator: ve, source: i() }),
      resolveLibraryPages: t().args({ refs: A(pp), includeDocuments: S() }),
      listLibraryPages: t().args({ includeDocuments: S() }),
      listLibraryDocs: t().args({ agentId: m }),
      setDocumentVisibility: t().args({ locator: ve, visibility: up }),
      getDocumentAssets: t().args({
        locator: ve,
        names: A(i()),
        groupChatId: d(m),
      }),
      submitFeedback: t().args(sp),
      getWindowState: t().noArgs,
      minimizeWindow: t().noArgs,
      focusWindow: t().noArgs,
      toggleMaximizeWindow: t().noArgs,
      closeWindow: t().noArgs,
      resizeWindowWidth: t().args({ deltaWidth: b() }),
      setTitleBarOverlayTone: t().args({ isOverlayTone: S() }),
      setViewingAgent: t().args({ agentId: v(i()) }),
      setComposingAgent: t().args({ agentId: i(), composing: S() }),
      setComputerViewOpen: t().args({ isOpen: S() }),
      setUnreadFilterMenuChecked: t().args({ isChecked: S() }),
      getThemeState: t().noArgs,
      setThemePreference: t().args({ preference: _("theme preference", Rr) }),
      getBotColorInChatEnabled: t().noArgs,
      setBotColorInChatEnabled: t().args(Ae),
      getHardwareAcceleration: t().noArgs,
      setHardwareAccelerationEnabled: t().args(Ae),
      getSpellCheckEnabled: t().noArgs,
      setSpellCheckEnabled: t().args(Ae),
      getDesktopNotificationPreferences: t().noArgs,
      setDesktopNotificationPreferences: t().args({
        preferences: _("notification-preferences", Tr),
      }),
      relaunchDesktop: t().noArgs,
      getLanguageState: t().noArgs,
      setLanguagePreference: t().args({
        preference: _("language preference", Ir),
      }),
      getEgressTunnelEnabled: t().noArgs,
      setEgressTunnelEnabled: t().args(Ae),
      getEgressTunnelStatus: t().noArgs,
      claimEgressTunnel: t().noArgs,
      getWebauthnProxyEnabled: t().noArgs,
      setWebauthnProxyEnabled: t().args(Ae),
      runNetworkDiagnostics: t().noArgs,
      getUpdateStatus: t().noArgs,
      checkForUpdates: t().noArgs,
      setUpdateTrack: t().args({ track: v(_("update track", Ia)) }),
      quitAndInstallUpdate: t().args({ expectedVersion: i() }),
      setAutoUpdateWhenIdle: t().args(Ae),
      getBoxMigrationStatus: t().noArgs,
      getBoxHostPhase: t().noArgs,
      markDeepLinksReady: t().noArgs,
      getOnboardingSeen: t().noArgs,
      setOnboardingSeen: t().args({ seen: S() }),
      getTimeZone: t().noArgs,
      setTimeZoneOverride: t().args({ timeZone: v(Ju) }),
      getAutoReviewInstructions: t().noArgs,
      setAutoReviewInstructions: t().args({
        instructions: p({
          isEnabled: S(),
          allowInstructions: A(i()),
          blockInstructions: A(i()),
        }),
      }),
      getLocalToolPermission: t().noArgs,
      getMessagesAppIcon: t().noArgs,
      getTeamMemberPolicy: t().noArgs,
      setLocalToolPermission: t().args({
        permission: _("local tool permission", Yi),
        machineId: d(c),
      }),
      recordLocalToolApproval: t().args({
        approvalId: m,
        action: _("local tool action", we),
        target: i(),
        machineId: d(i()),
      }),
      clearLocalToolApprovals: t().noArgs,
      recordLocalToolStandingGrant: t().args({
        action: _("local tool action", we),
        recipient: m,
        machineId: d(i()),
      }),
      getLocalToolActionGrant: t().args({ action: _("local tool action", we) }),
      setLocalToolActionGrant: t().args({
        action: _("local tool action", we),
        granted: S(),
      }),
      pickAvatarSource: t().noArgs,
      pickAvatarFile: t().noArgs,
      generateAgentAvatarImage: t().args({ description: i() }),
      resolveAttachmentMedia: t().args({
        source: i(),
        inline: d(S()),
        rendition: d(_("image rendition", Nr)),
        inRoom: d(S()),
        preview: d(he()),
        viewSlot: d(v(i())),
      }),
      readAttachmentText: t().args({
        path: i(),
        agentId: d(i()),
        viewSlot: d(v(i())),
      }),
      readAttachmentBytes: t().args({
        path: i(),
        maxBytes: d(b()),
        agentId: d(i()),
        viewSlot: d(v(i())),
      }),
      stageAttachmentBytes: t().args({ filename: i(), bytes: he() }),
      stageAttachmentPath: t().args({ filename: i(), sourcePath: i() }),
      downloadAttachment: t().args({ path: i(), suggestedName: d(i()) }),
      commitStagedAttachments: t().args({
        agentId: m,
        sessionId: d(i()),
        paths: A(i()),
        filenames: A(i()),
        storeRouted: d(S()),
        progressKey: d(i()),
      }),
      discardStagedAttachment: t().args({ path: i() }),
      preuploadStagedAttachment: t().args({
        agentId: m,
        sessionId: d(i()),
        path: i(),
        filename: i(),
      }),
      releaseStagedAttachmentPreupload: t().args({ path: i() }),
      precaptionStagedAttachment: t().args({
        path: i(),
        agentId: i(),
        draftText: i(),
        priorUserMessages: A(i()),
      }),
      forceRecreateComputer: t().noArgs,
      updateComputer: t().args({
        id: i(),
        requestId: m,
        acknowledgeTerminalUpgradeSchedule: d(S()),
      }),
      getComputerUpgradeSchedule: t().noArgs,
      scheduleComputerUpgrade: t().args(ns),
      rescheduleComputerUpgrade: t().args(ns),
      cancelComputerUpgrade: t().args(
        _("computer upgrade cancellation args", Ar),
      ),
      forceReconnectGateway: t().noArgs,
      getExperimentsSnapshot: t().noArgs,
      exposeFeatureGate: t().args({
        name: i(),
        rendered: d(p({ treatment: S(), accountSlot: i() })),
      }),
      peekUsageWarningAssignment: t().noArgs,
      exposeUsageWarningExperiment: t().args({ percentUsed: b() }),
      logComposerTriggerExperimentExposure: t().args({ trigger: u("at") }),
      logGroupChatDiscouragementExperimentExposure: t().noArgs,
      logInviteTeammatesExperimentExposure: t().noArgs,
      logOnboardingJobRoleExperimentExposure: t().noArgs,
      logOnboardingRoleUseCaseBotsExperimentExposure: t().noArgs,
      logOnboardingNotificationsAskExperimentExposure: t().noArgs,
      applyFeatureFlagOverride: t().args({
        command: R(
          p({ kind: u("set"), name: i(), value: S() }),
          p({ kind: u("clear"), name: i() }),
          p({ kind: u("clear-all") }),
          p({ kind: u("set-all-bundled") }),
        ),
      }),
      refreshFeatureFlags: t().noArgs,
      applyExperimentOverride: t().args({
        command: R(
          p({ kind: u("set"), experiment: i(), param: i(), value: zu }),
          p({ kind: u("clear"), experiment: i(), param: i() }),
          p({ kind: u("clear-experiment"), experiment: i() }),
          p({ kind: u("clear-all") }),
        ),
      }),
      startRpcTraceWindow: t().noArgs,
      readTranscriptStoreTail: t().args(
        _("transcript store read args (agent id, positive limit, reason)", qi),
      ),
      getPublicBotTemplate: t().args({
        shareId: _("share id", (e) => typeof e == "string" && _r.test(e)),
      }),
      listPublicBotMarketplace: t().noArgs,
      getGrokBotSlackInstallState: t().args({ agentId: c }),
      startGrokBotSlackConnect: t().args({ agentId: c }),
      installGrokBotSlackApp: t().args({
        agentId: c,
        slackTeamId: v(c),
        replaceExistingApp: d(S()),
      }),
      reinstallGrokBotSlackApp: t().args({ agentId: c, automatic: S() }),
      uninstallGrokBotSlackApp: t().args({
        agentId: c,
        forgetIfUnreachable: d(S()),
      }),
      listGrokBotTeamAgents: t().noArgs,
      listGrokBotAgentSessions: t().args({ agentId: c }),
      setGrokBotAgentVisibility: t().args({
        agentId: c,
        visibility: pe("Grok Bot agent visibility", ["owner", "team"]),
      }),
      cloneGrokBotAgentToTeam: t().args({ agentId: c, offerEntryId: c }),
      setGrokBotAgentVoice: t().args({
        agentId: c,
        voiceId: d(v(i())),
        voiceSpeed: d(b()),
        voiceLanguage: d(i()),
      }),
      updateGrokBotAgent: t().args({
        serverId: c,
        name: d(i()),
        description: d(i()),
        title: d(i()),
        avatarShape: d(i()),
        avatarColor: d(i()),
        avatarPngBase64: d(v(i())),
      }),
      publishGrokBotAgent: t().args({ agentId: c }),
      unpublishGrokBotAgent: t().args({ agentId: c }),
      setGrokBotAgentSidebarHidden: t().args({ agentId: c, isHidden: S() }),
      addGrokBotRoomPeople: t().args({ agentId: c, userIds: A(b()) }),
      removeGrokBotRoomPeople: t().args({ agentId: c, userIds: A(b()) }),
      listGrokBotAgentManagers: t().args({ serverId: c }),
      addGrokBotAgentManager: t().args({ serverId: c, userId: b() }),
      removeGrokBotAgentManager: t().args({ serverId: c, userId: b() }),
      setGrokBotAgentMeetingsVisibility: t().args({
        agentId: ue,
        visibility: pe("meetings visibility", mr),
      }),
      listGrokBotAgentMeetings: t().args({ agentId: ue, fresh: S() }),
      getGrokBotAgentAccess: t().args({ serverId: c }),
      updateGrokBotAgentAccess: t().args({
        serverId: c,
        expectedStateToken: i(),
        entries: A(
          p({
            principal: R(
              p({ kind: u("team") }),
              p({ kind: u("user"), userId: b() }),
              p({ kind: u("group"), groupId: c }),
            ),
            role: pe("Team Bot access role", Sr),
          }),
        ),
      }),
      getGrokBotAgentLinkAccess: t().args({ agentId: c }),
      getGrokBotAgentPlugins: t().args({ agentId: c }),
      setGrokBotAgentPlugins: t().args({
        agentId: c,
        plugins: A(
          R(
            p({ kind: u("plugin"), pluginId: c }),
            p({ kind: u("config-update"), pluginId: c, mcpConfigJson: c }),
            p({
              kind: u("inline"),
              name: c,
              displayName: i(),
              description: i(),
              mcpConfigJson: c,
            }),
          ),
        ),
      }),
      setGrokBotAgentPluginVariables: t().args({
        agentId: c,
        pluginId: c,
        variables: de(R(i(), b(), S())),
        mergeWithStored: d(S()),
      }),
      addGrokBotAgentSkill: t().args({
        agentId: c,
        name: d(i()),
        description: d(i()),
        content: c,
        files: d(Zi),
      }),
      updateGrokBotAgentSkill: t().args({
        agentId: c,
        name: c,
        description: d(i()),
        content: c,
        files: d(Zi),
      }),
      removeGrokBotAgentSkill: t().args({ agentId: c, name: c }),
      listGrokBotUserBotMemories: t().args({ agentId: c }),
      promoteGrokBotMemoriesToTeam: t().args({ agentId: c, factIds: A(c) }),
      listGrokBotVaultCredentials: t().noArgs,
      putGrokBotVaultCredential: t().args({
        id: i(),
        title: i(),
        username: i(),
        notes: i(),
        sites: A(i()),
        password: i(),
      }),
      deleteGrokBotVaultCredential: t().args({ id: c }),
      listGrokBotEmailInboxes: t().noArgs,
      createGrokBotEmailInbox: t().args({ username: i(), displayName: i() }),
      listGrokBotSecrets: t().args({ serverId: c }),
      putGrokBotSecret: t().args({
        serverId: c,
        name: c,
        description: i(),
        value: m,
      }),
      deleteGrokBotSecret: t().args({ serverId: c, name: c }),
      carryUserSecretsToGrokBot: t().args({ serverId: c, names: A(c) }),
      listGrokBotAgentFiles: t().args({ agentId: ue }),
      uploadGrokBotAgentFile: t().args({
        agentId: ue,
        fileName: c,
        contentType: i(),
        bytes: he(),
      }),
      deleteGrokBotAgentFile: t().args({ agentId: ue, name: c }),
      getHostPinnedAgents: t().noArgs,
      getServerPinnedAgents: t().noArgs,
      setHostPinnedAgents: t().args({ pinnedAgentIds: A(i()) }),
      getHostSidebarSections: t().noArgs,
      setHostSidebarSections: t().args({
        sections: A(p({ id: i(), name: i(), agentIds: A(i()) })),
      }),
      transcribeAudio: t().args({ audio: op, mimeType: i(), language: d(i()) }),
      synthesizeSpeech: t().args({ text: ip, voiceId: d(i()) }),
      getCursorAuthStatus: t().noArgs,
      loginCursor: t().noArgs,
      getCursorLoginFlight: t().noArgs,
      cancelCursorLoginFlight: t().noArgs,
      logoutCursor: t().noArgs,
      listCursorAccounts: t().noArgs,
      addCursorAccount: t().noArgs,
      switchCursorAccount: t().args({ accountId: i() }),
      removeCursorAccount: t().args({ accountId: i() }),
      updateCursorAccountName: t().args({ name: i() }),
      getCursorAvatar: t().noArgs,
      updateCursorProfilePhoto: t().args({ photo: ap }),
      getSandMachines: t().noArgs,
      updateSandMachineLabel: t().args({ machineId: i(), label: i() }),
      removeSandMachine: t().args({ machineId: i(), accountSlot: i() }),
      startPasskeyEnrollment: t().noArgs,
      verifyPasskeyEnrollmentCode: t().args({ code: Qu }),
      beginPasskeyRegistration: t().args({ enrollmentTicket: c }),
      listPasskeys: t().noArgs,
      revokePasskey: t().args({ credentialId: c }),
      getCursorSelectedTeam: t().noArgs,
      listCursorTeamMemberships: t().noArgs,
      listCursorTeamMembers: t().args({ teamId: b() }),
      getCursorTeamInviteEligibility: t().noArgs,
      sendCursorTeamInvites: t().args({
        teamId: b(),
        emails: A(i()),
        surface: es,
      }),
      getCursorTeamInviteLink: t().args({ teamId: b(), surface: es }),
      listCursorTeamGroups: t().args({ teamId: b() }),
      ackCursorTeamFallback: t().args({
        notice: p({
          fromTeamId: b(),
          fromTeamName: v(i()),
          toTeam: v(p({ id: b(), name: i() })),
        }),
      }),
      getCursorWeeklyUsage: t().noArgs,
      getCursorUsageSummary: t().noArgs,
      getCursorEnterpriseUsage: t().args({ teamId: b() }),
      getCursorUsageBreakdown: t().args({ includeCredits: S() }),
      getCursorPrReviewPreferences: t().noArgs,
      getCursorOriginPrStatus: t().args({ prUrl: i() }),
      getCursorPrivacyModeEnabled: t().noArgs,
      getCursorUnifyCta: t().noArgs,
      getSandAccess: t().noArgs,
      getSandAccessFresh: t().noArgs,
      getGrokBotTermsRecord: t().noArgs,
      markGrokBotTermsSeen: t().noArgs,
      clearGrokBotConnectorPreferences: t().noArgs,
      mintVoiceCallCredential: t().noArgs,
      mintXaiCommerceBearer: t().noArgs,
      getCursorPrepaidSettings: t().args({
        wallet: zn,
        expectedAccountScope: m,
      }),
      setCursorPrepaidHardLimit: t().args({
        wallet: zn,
        expectedAccountScope: m,
        fields: p({ hardLimit: np, noUsageBasedAllowed: S() }),
      }),
      setCursorPrepaidAutoTopUp: t().args({
        wallet: zn,
        expectedAccountScope: m,
        rule: v(p({ enabled: S(), thresholdCents: Ji, topUpAmountCents: Ji })),
      }),
      voiceCallHarnessSession: t().args({
        dial: rs,
        args: p({
          agentId: i(),
          agentName: i(),
          userName: d(dp),
          description: d(i()),
          spokenLanguage: d(i()),
        }),
      }),
      voiceCallHarnessTool: t().args({
        dial: rs,
        invocation: p({
          agentId: i(),
          callId: i(),
          name: i(),
          input: _n(),
          line: p({
            theyJustTalked: S(),
            newsOwed: S(),
            receiptOwed: S(),
            alreadySpokeThisTurn: S(),
          }),
        }),
      }),
      invokeCursorDashboardAction: t().args({ action: i(), args: de(i()) }),
      cancelCursorSandTrial: t().noArgs,
      prepareCursorScmConnect: t().args({
        provider: pe("SCM connect provider", fr),
        forceOauth: d(S()),
      }),
      completeCursorScmConnect: t().args({
        state: c,
        code: d(i()),
        installationId: d(i()),
        setupAction: d(i()),
        error: d(i()),
      }),
      getCursorGithubRepoAccess: t().args({ repoSlug: c }),
      runPasskeyCeremony: t().args({
        ceremonyId: c,
        path: Zu,
        token: c,
        challengeId: d(c),
      }),
      cancelPasskeyCeremony: t().args({ ceremonyId: c }),
      setCursorSpendLimit: t().args(_("spend limit update", yr)),
      reportAgentLoad: t().args(E(Ha, Ka)),
      reportAccessBlocked: t().args(E(Wa, ja)),
      reportAgentsUnreachable: t().args(E($a, Ya)),
      reportRecoveryAction: t().args(E(Xa, qa)),
      reportRebuildLifecycle: t().args(E(Ja, za)),
      reportReconciliation: t().args(E(Qa, Za)),
      reportBoxVisibility: t().args(E(ni, ei)),
      reportSendLatency: t().args(E(ri, ti)),
      reportSendAck: t().args(E(ai, oi)),
      reportTurnClientStart: t().args(E(si, ii)),
      reportTurnClientOutcome: t().args(E(li, di)),
      reportReactionAck: t().args(E(ui, ci)),
      reportRenderTtfr: t().args(E(_i, fi)),
      reportRenderStream: t().args(E(Ei, gi)),
      reportVncSession: t().args(E(yi, pi)),
      reportVncLiveness: t().args(E(zi, Xi)),
      reportOpenComputer: t().args(E(mi, Si)),
      reportUpdatePrompt: t().args(E(Ri, Ai)),
      reportUsageWarning: t().args(E(hi, Ti)),
      reportSidebarAction: t().args(E(ki, Oi)),
      reportMarketplaceSearch: t().args(E(Di, xi)),
      reportArtifactEngagement: t().args(E(Ni, Ii)),
      reportCloudAgentArtifact: t().args(E(bi, Ci)),
      reportSigninGate: t().args(E(wi, Mi)),
      reportOnboardingStep: t().args(E(vi, Pi)),
      reportOnboardingCompleted: t().args(E(Vi, Ui)),
      reportClientFailure: t().args(E(Ki, Fi)),
      reportHeapMetrics: t().args(rr),
      noteSentryConversation: t().args(E(ji, Hi)),
      openCloudAgent: t().args({
        bcId: He,
        target: d(R(u("default"), u("web"))),
      }),
      getLinkMetadata: t().args({
        url: i(),
        image: d(R(u("card"), u("source"))),
        beforeHover: d(S()),
      }),
      stageMcpAppDocument: t().args({ html: i(), csp: d(tp) }),
      listSecrets: t().noArgs,
      readClientPersistence: t().args({ key: i() }),
      readManyClientPersistence: t().args({ include: A(i()), exclude: A(i()) }),
      writeClientPersistence: t().args({ key: i(), value: i() }),
      removeClientPersistence: t().args({ key: i() }),
      listClientPersistenceKeys: t().args({ prefix: i() }),
      hasMigratedClientPersistence: t().noArgs,
      migrateClientPersistence: t().args({
        entries: A(p({ key: i(), value: i() })),
      }),
      getCredentialsState: t().noArgs,
      syncCredentialProvider: t().noArgs,
      disconnectCredentialProvider: t().args({ connectionId: m }),
      disconnectScmConnection: t().args({ platform: m }),
      isSlackLinked: t().noArgs,
      getSlackLinkUrl: t().noArgs,
      approveCredentialRequest: t().args({
        entryId: m,
        agentId: m,
        credentialId: m,
        connectionId: m,
        catalogRevision: m,
        targetSite: m,
        harness: Qi,
      }),
      denyCredentialRequest: t().args({ entryId: m, agentId: m, harness: Qi }),
      detectCredentialMint: t().noArgs,
      startCredentialMint: t().args(rp),
      connectCredentialProviderOAuth: t().args({ connectionId: d(m) }),
      cancelCredentialProviderOAuth: t().noArgs,
      getMcpState: t().noArgs,
      getGrokBotAgentMcpServers: t().args({ agentId: i() }),
      getEffectivePlugins: t().noArgs,
      getMcpCatalog: t().noArgs,
      refreshMcpCatalog: t().noArgs,
      getMcpTeamPopularity: t().noArgs,
      getSharepointSignIn: t().args({ access: R(u("read"), u("write")) }),
      getMcpPluginLogo: t().args({ url: i() }),
      installEntry: t().args({
        entryId: i(),
        values: d(de(R(i(), b(), S()))),
        hasTeamConfiguredVariables: d(S()),
      }),
      updatePluginInstall: t().args({
        pluginId: i(),
        values: de(R(i(), b(), S())),
      }),
      removeMcpServer: t().args({ serverId: i() }),
      uninstallPlugin: t().args({ pluginId: i() }),
      reconcileUnpublishedPlugin: t().args({ pluginId: i() }),
      authenticateMcpServer: t().args({
        serverId: i(),
        accountKey: d(i()),
        forceReauth: d(S()),
        grokBotAgentId: d(i()),
      }),
      renameMcpAccount: t().args({
        serverId: i(),
        accountKey: i(),
        newAccountKey: i(),
      }),
      removeMcpAccount: t().args({ serverId: i(), accountKey: i() }),
      setMcpCustomInstructions: t().args({ serverId: i(), instructions: i() }),
      listMcpServerTools: t().args({
        serverId: i(),
        demand: d(u("background")),
      }),
      toggleMcpToolDisabled: t().args({ serverId: i(), toolName: i() }),
      setMcpToolPermissions: t().args(cp),
      adoptServerMcpToolPermissions: t().noArgs,
      getFinanceOverview: t().noArgs,
      deleteFinanceConnection: t().args({ connectionId: i() }),
      startFinanceLink: t().args({ repairLinkedBank: d(S()) }),
      attachProdBoxStatus: t().noArgs,
      checkMessagesPermissions: t().args({
        prompt: d(R(u("automation"), u("fullDiskAccess"), u("contacts"))),
      }),
      getCurrentMachineMessagesEnabled: t().noArgs,
      updateCurrentMachineMessagesEnabled: t().args({ messagesEnabled: S() }),
      listMessagesAllowedRecipients: t().noArgs,
      revokeMessagesAllowedRecipient: t().args({ recipient: m }),
      listChromeCookieAllowItems: t().noArgs,
      importChromeCookies: t().args({
        cookies: A(p({ profileId: m, domain: m, name: m, path: m })),
      }),
      listCookieOriginGrants: t().noArgs,
      putCookieOriginGrants: t().args({
        grants: A(p({ profileId: c, origin: c })),
      }),
      leaveMeeting: t().args({ meetingId: m, agentId: m }),
    },
    events: le(),
    failureCodes: le(),
  });
function Zn(e) {
  return e instanceof Error ? e.message : void 0;
}
function dn(...e) {
  console.warn("[sand-webview-preload]", ...e);
}
var yp = `self.onmessage = async ({ data: { input, draw, gpuRaster } }) => {
  try {
    const bitmap = input instanceof ImageBitmap ? input : await createImageBitmap(input, {
      colorSpaceConversion: "none",
      premultiplyAlpha: !draw && /^image\\/jpe?g$/.test(input.type) ? "none" : "default",
    });
    let canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    if (draw && gpuRaster) {
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let opaque = true;
      for (let i = 3; opaque && i < data.length; i += 4) opaque = data[i] === 255;
      if (opaque) {
        canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0);
      }
      bitmap.close();
    } else if (draw) {
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
    } else {
      canvas.getContext("bitmaprenderer").transferFromImageBitmap(bitmap);
    }
    const png = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
    self.postMessage(png, [png.buffer]);
  } catch (error) {
    self.postMessage(String(error));
  }
};`,
  as;
async function Sp(e) {
  if (e.kind === "bytes") return new Blob([e.bytes], { type: e.mime });
  let n = Array.from(document.images).find((r) => r.currentSrc === e.url);
  return n == null
    ? null
    : await createImageBitmap(n, { colorSpaceConversion: "none" });
}
function mp(e, n) {
  as ??= URL.createObjectURL(new Blob([yp], { type: "text/javascript" }));
  let r = new Worker(as);
  return new Promise((a, s) => {
    ((r.onmessage = ({ data: y }) => a(y)),
      (r.onerror = (y) => s(new Error(y.message))),
      r.postMessage({ input: e, ...n }, e instanceof ImageBitmap ? [e] : []));
  }).finally(() => r.terminate());
}
async function fp(e) {
  try {
    let n = await Sp(e);
    if (n == null) return null;
    let r = await mp(n, {
      draw: e.kind === "image" || e.turned,
      gpuRaster: e.gpuRaster,
    });
    if (r instanceof Uint8Array)
      return e.kind === "bytes" && e.tagSrgb ? Ht(r) : r;
    dn("PNG encode failed", String(r));
  } catch (n) {
    dn("PNG encode failed", Zn(n));
  }
  return null;
}
function is(e, n) {
  let r = e.ports[0];
  r != null &&
    fp(n)
      .then((a) => r.postMessage(a))
      .catch((a) => dn("PNG reply failed", Zn(a)))
      .finally(() => r.close());
}
function ss(e) {
  let n = null;
  return {
    bridge: {
      claim(r) {
        return n != null
          ? null
          : ((n = r),
            {
              request: () => {
                n === r && e.invokeRequest();
              },
              release: () => {
                n === r && (n = null);
              },
            });
      },
    },
    deliver(r) {
      n?.onPort(r);
    },
  };
}
function ds(e) {
  return {
    postMessage: (n) => {
      e.postMessage(n);
    },
    close: () => {
      e.close();
    },
    start: () => {
      e.start();
    },
    addEventListener: (n, r) => {
      if (n === "message") {
        e.addEventListener("message", (a) => {
          r({ data: a.data });
        });
        return;
      }
      e.addEventListener("close", () => {
        r({});
      });
    },
  };
}
function ls(e, n) {
  return e === "served"
    ? Promise.resolve()
    : new Promise((r) => {
        n(r);
      });
}
function cs(e, n) {
  return {
    invoke: (r, a) => e.then(() => n.invoke(r, a)),
    on: (r, a) => n.on(r, a),
  };
}
var us = "sand:render-trace-port";
function ps(e, n = () => new MessageChannel()) {
  let r = null;
  return {
    postMessage(a) {
      if (r === null) {
        let s = n();
        (e.postMessage(us, null, [s.port2]), (r = s.port1));
      }
      r.postMessage(a);
    },
  };
}
async function ys(e, n, r) {
  let a = e.diskPathOf(r);
  return a != null
    ? await e.stagePath({ filename: n, sourcePath: a })
    : await e.stageBytes(n, new Uint8Array(await r.arrayBuffer()));
}
var { mainEdge: _p, ...gp } = O.ipcRenderer.sendSync("sand:boot-snapshot-sync"),
  Ss = cs(
    ls(_p, (e) => {
      O.ipcRenderer.once(jt, e);
    }),
    fn(),
  ),
  ms = ss({
    invokeRequest: () => {
      Ss.invoke("sand:coordinator-port-request", void 0);
    },
  }),
  { stageAttachmentPath: Ep, ...fs } = Fe(os, Ss),
  Ap = {
    diskPathOf: (e) =>
      (e instanceof File && O.webUtils.getPathForFile(e)) || null,
    stagePath: Ep,
    stageBytes: (e, n) => fs.stageAttachmentBytes({ filename: e, bytes: n }),
  },
  Rp =
    process.env.SAND_RESTART_EXIT_CODE != null &&
    process.env.SAND_RESTART_EXIT_CODE.length > 0,
  Tp = "api2.cursor.sh";
function hp() {
  let e = process.env.SAND_BACKEND_URL ?? process.env.CURSOR_API_BASE_URL;
  return e == null || e.length === 0
    ? !0
    : URL.canParse(e) && new URL(e).host === Tp;
}
var Cp = {
    main: fs,
    boot: gp,
    environment: {
      platform: process.platform,
      isDev: Rp,
      usesProductionBackend: hp(),
      devVoiceHarness:
        process.env.SAND_VOICE_HARNESS === "backend" ? "backend" : "package",
      hasChromeCookieImport: Ft(process.platform),
    },
    local: {
      getZoomFactor: () => O.webFrame.getZoomFactor(),
      stageAttachmentFile: (e, n) => ys(Ap, e, n),
      noteRendererAlive(e) {
        O.ipcRenderer.send(Yt, e);
      },
      noteBootGateLanded() {
        O.ipcRenderer.send($t);
      },
      noteBootGateOpened(e) {
        O.ipcRenderer.send(qt, e);
      },
    },
  },
  bp = ms.bridge;
O.contextBridge.exposeInMainWorld("desktop", Cp);
wt();
O.contextBridge.exposeInMainWorld("coordinatorPort", bp);
O.contextBridge.exposeInMainWorld("sandRenderTrace", ps(O.ipcRenderer));
Mt();
O.contextBridge.exposeInMainWorld("desktopMount", Fe(ar, fn()));
O.ipcRenderer.on("sand:coordinator-port", (e) => {
  let n = e.ports[0];
  n != null && ms.deliver(ds(n));
});
O.ipcRenderer.on(Kt, is);
window.addEventListener("online", () => O.ipcRenderer.send(Wt));
//# debugId=9c81c427-7bea-4c62-a245-c5f66ab2bb10
