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
      (e._sentryDebugIds[n] = "f3560e3c-3d6e-42cd-925d-a01a5eb0fcc6"),
      (e._sentryDebugIdIdentifier =
        "sentry-dbid-f3560e3c-3d6e-42cd-925d-a01a5eb0fcc6"));
  } catch (e) {}
})();
("use strict");
var ae = Object.defineProperty;
var Zn = Object.getOwnPropertyDescriptor;
var et = Object.getOwnPropertyNames;
var nt = Object.prototype.hasOwnProperty;
var tt = (e, n) => () => (e && (n = e((e = 0))), n);
var Ae = (e, n) => {
    for (var t in n) ae(e, t, { get: n[t], enumerable: !0 });
  },
  rt = (e, n, t, i) => {
    if ((n && typeof n == "object") || typeof n == "function")
      for (let o of et(n))
        !nt.call(e, o) &&
          o !== t &&
          ae(e, o, {
            get: () => n[o],
            enumerable: !(i = Zn(n, o)) || i.enumerable,
          });
    return e;
  };
var ot = (e) => rt(ae({}, "__esModule", { value: !0 }), e);
var r = tt(() => {});
var br = {};
Ae(br, { installVncPreload: () => Qn });
module.exports = ot(br);
r();
r();
var U = require("electron");
r();
var Ie = ["ready", "failed", "stuck", "aborted"];
var it = 1048576,
  at = 1024e3,
  st = 1e4,
  dt = 1.1,
  lt = 1.25;
function ct(e) {
  let n = (o) =>
      typeof o == "number" && Number.isInteger(o) && o >= 0 && o <= e,
    t = (o) => (n(o) ? o : void 0),
    i = (o) => {
      let a = Math.min(Math.max(Math.round(o), 0), e);
      return n(a) ? a : i(0);
    };
  return { parse: t, to: i };
}
function Oe(e, n) {
  let t = [0, 1],
    i = 1;
  for (;;) {
    let o = Math.max(i + 1, Math.round(i * e));
    if (o > n) return t;
    (t.push(o), (i = o));
  }
}
var ut = Oe(dt, it),
  pt = Oe(lt, at);
function Le(e) {
  let n = new Set(e),
    t = (a) => typeof a == "number" && n.has(a),
    i = (a) => (t(a) ? a : void 0),
    o = (a) => {
      let s = e.findLast((d) => d <= a) ?? 0;
      return t(s) ? s : o(0);
    };
  return { parse: i, to: o };
}
var Pe = Le(ut),
  De = Le(pt),
  Ne = ct(st),
  Sr = Pe.parse,
  _r = Pe.to,
  xr = De.parse,
  Tr = De.to,
  wr = Ne.parse,
  Cr = Ne.to;
r();
r();
var P = {
  now: () => Date.now(),
  monotonicNow: () => performance.now(),
  schedule(e, n, t) {
    mt(e);
    let i = !0,
      o = globalThis.setTimeout(() => {
        i && ((i = !1), n());
      }, e);
    return (
      t?.keepEventLoopAlive !== !0 && ft(o) && o.unref(),
      {
        dispose() {
          i && ((i = !1), globalThis.clearTimeout(o));
        },
      }
    );
  },
};
function ft(e) {
  return (
    typeof e == "object" &&
    e !== null &&
    "unref" in e &&
    typeof e.unref == "function"
  );
}
function mt(e) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError("delayMs must be a finite non-negative number");
}
r();
var yt = () => {};
function gt(e, n, t) {
  return {
    policyName: e,
    reason: n,
    errorClass: t instanceof Error ? t.name : typeof t,
  };
}
var B = class extends Error {
  constructor(n) {
    (super(`Deadline exceeded for ${n}`),
      (this.code = "deadline_exceeded"),
      (this.name = "DeadlineExceededError"),
      (this.policyName = n));
  }
};
function W(e) {
  (Ve(e.name), Be(e.timeoutMs, "timeoutMs"));
  let n = e.clock ?? P;
  return {
    name: e.name,
    async run(t, i) {
      if (i?.aborted) throw Fe(i, e.name);
      let o = new AbortController(),
        a = () => {},
        s = new Promise((f, c) => {
          a = c;
        }),
        d = () => {},
        u = new Promise((f, c) => {
          d = c;
        }),
        p = () => {};
      if (i != null) {
        let f = () => {
          let c = Fe(i, e.name);
          (d(c), o.abort(c));
        };
        (i.addEventListener("abort", f, { once: !0 }),
          (p = () => i.removeEventListener("abort", f)));
      }
      let m = n.schedule(e.timeoutMs, () => {
        let f = new B(e.name);
        (a(f), o.abort(f));
      });
      try {
        return await Promise.race([t(o.signal), s, u]);
      } finally {
        (m.dispose(), p());
      }
    },
  };
}
function $(e) {
  if ((Ve(e.name), Be(e.intervalMs, "intervalMs"), e.intervalMs === 0))
    throw new RangeError(`${e.name}: intervalMs must be greater than 0`);
  let n = e.clock ?? P,
    t = e.report ?? yt;
  return {
    name: e.name,
    start(i, o) {
      let a = Et(),
        s = () => {},
        d = new Promise((R) => {
          s = R;
        }),
        u = () => {},
        p = (R) => (a.dispose() ? (u(), s(R), !0) : !1),
        m = () => {
          p({ policyName: e.name, reason: "disposed" });
        },
        f = (R) => {
          p({ policyName: e.name, reason: "tick-failed", cause: R }) &&
            t(gt(e.name, "tick-failed", R));
        },
        c = () => {
          if ((a.fired(), a.current.state === "disposed")) return;
          let R;
          try {
            R = i();
          } catch (b) {
            f(b);
            return;
          }
          R.then(() => {
            a.current.state !== "disposed" &&
              a.arm(n.schedule(e.intervalMs, c));
          }, f);
        },
        y = { dispose: m, stopped: d };
      return o?.aborted
        ? (m(), y)
        : (o != null &&
            (o.addEventListener("abort", m, { once: !0 }),
            (u = () => o.removeEventListener("abort", m))),
          (e.leading ?? !0) ? c() : a.arm(n.schedule(e.intervalMs, c)),
          y);
    },
  };
}
function Et() {
  let e = { state: "running" };
  return {
    get current() {
      return e;
    },
    arm(n) {
      if (e.state === "disposed") {
        n.dispose();
        return;
      }
      (e.state === "armed" && e.handle.dispose(),
        (e = { state: "armed", handle: n }));
    },
    fired() {
      e.state === "armed" && (e = { state: "running" });
    },
    dispose() {
      return e.state === "disposed"
        ? !1
        : (e.state === "armed" && e.handle.dispose(),
          (e = { state: "disposed" }),
          !0);
    },
  };
}
var Pr = { none: 0, equal: 1 / 2, full: 1 };
function Fe(e, n) {
  return e.reason ?? Rt(n);
}
function Rt(e) {
  let n = new Error(`Operation aborted for ${e}`);
  return ((n.name = "AbortError"), n);
}
var bt = /^[a-z0-9]+([-.][a-z0-9]+)*$/;
function Ve(e) {
  if (!bt.test(e))
    throw new TypeError(
      `name must be lowercase segments joined by "-" or ".", got ${JSON.stringify(e)}`,
    );
}
function Be(e, n) {
  if (!Number.isFinite(e) || e < 0)
    throw new RangeError(`${n} must be a finite non-negative number`);
}
r();
r();
r();
r();
r();
r();
r();
r();
r();
r();
var ht = new Map([
  ["enabled", "enabled"],
  ["enabled_on", "enabled"],
  ["enabled_force", "enabled"],
  ["enabled_force_on", "enabled"],
  ["enabled_readback", "enabled"],
  ["disabled_software", "disabled_software"],
  ["unavailable_software", "disabled_software"],
]);
function Ue(e) {
  let n = !1;
  return (
    e.once("gpu-info-update", () => {
      n = !0;
    }),
    () =>
      e.isHardwareAccelerationEnabled()
        ? n
          ? (ht.get(e.getGPUFeatureStatus().gpu_compositing) ?? "unknown")
          : "unknown"
        : "disabled_software"
  );
}
r();
r();
function w(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
var St = 1024 * 1024,
  wo = St / 2;
r();
r();
r();
r();
r();
var _t = 864e5,
  ri = 30 * _t;
var oi = [...Ie, "pending"];
r();
r();
r();
var _i = 256 * 1024;
r();
r();
var xt = /^[a-z0-9]+-[0-9]+$/;
function He(e) {
  return xt.test(e);
}
var Tt = 2 ** 32;
function je(e) {
  return Number.isInteger(e) && e >= 0 && e < Tt;
}
var se = 2,
  Ge = ["click", "keydown", "pointerdown", "wheel", "input"],
  Ke = ["open", "close"],
  We = ["overlay", "workspace", "shell"],
  $e = [
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
  qe = ["immediate", "user-blocking", "normal", "idle"],
  Ye = ["mount", "update"],
  Je = ["layout", "passive"],
  ze = ["view", "layout"],
  de = ["default", "transition"],
  le = ["quiet", "cap", "superseded"],
  Xe = ["presented", ...le];
r();
r();
var wt = Object.freeze({
  sampled: !1,
  sampleRate: 0,
  additionalArguments: Object.freeze([]),
});
r();
var Ct = [
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
  Zi = new Set(["dune_signal", "dune_reason", ...Ct]);
r();
r();
r();
r();
r();
var fa = BigInt(127),
  ma = BigInt(7),
  ya = new TextEncoder();
var va = BigInt(1e3);
r();
r();
r();
var It = Symbol("redirect"),
  Qe = class {
    constructor(n, t) {
      this.link = n;
      this.history = t;
    }
    link;
    history;
    [It]() {
      return "redirect";
    }
  };
var Ze = Object.freeze({
    workspace: Object.freeze({ idPrefix: "view" }),
    overlay: Object.freeze({ idPrefix: "overlay" }),
  }),
  _a = Object.freeze({ text: "", value: void 0 });
var I = (e) => typeof e == "string",
  ce = (e) => typeof e == "boolean",
  k = (e) => typeof e == "number" && Number.isFinite(e),
  _ = (e) => typeof e == "number" && Number.isInteger(e) && e >= 0,
  en = (e) => typeof e == "string" && He(e),
  ue = (e) => typeof e == "number" && je(e),
  Ot = (e) => e === se,
  Z = (e) => k(e) && e >= 0,
  Lt = (e) => k(e) && e > 0 && e <= 1;
function x(e) {
  let n = new Set(e);
  return (t) => typeof t == "string" && n.has(t);
}
function nn(e) {
  return (n) => n === null || e(n);
}
function ee(e) {
  return (n) => Array.isArray(n) && n.every(e);
}
function q(e, n, t = {}) {
  if (!w(e)) return !1;
  for (let i of Object.keys(e))
    if (!Object.hasOwn(n, i) && !Object.hasOwn(t, i)) return !1;
  for (let [i, o] of Object.entries(n)) if (!o(e[i])) return !1;
  for (let [i, o] of Object.entries(t))
    if (e[i] !== void 0 && !o(e[i])) return !1;
  return !0;
}
function pe(e, n = {}) {
  return (t) => {
    if (!w(t) || typeof t.kind != "string") return !1;
    let i = Object.hasOwn(e, t.kind) ? e[t.kind] : void 0,
      o = Object.hasOwn(n, t.kind) ? n[t.kind] : void 0;
    return i != null && q(t, { kind: I, ...i }, o);
  };
}
var tn = x(Object.keys(Ze)),
  Pt = /^(view|overlay):[a-z0-9-]+(\/[a-z0-9-]+)*$/,
  Dt = (e) =>
    !w(e) ||
    typeof e.entrypointId != "string" ||
    !q(e, { surface: x(We), entrypointId: I })
      ? !1
      : e.surface === "shell"
        ? e.entrypointId === ""
        : Pt.test(e.entrypointId),
  Nt = pe(
    {
      navigation: { action: x(Ke), surface: tn, entrypointId: I, startMs: k },
      selection: { startMs: k },
      interaction: { event: x(Ge), startMs: k },
    },
    {
      navigation: { absorbedInputs: _ },
      interaction: {
        route: Dt,
        target: (e) => q(e, { component: ue }, { role: x($e) }),
      },
    },
  ),
  Ft = pe({
    render: { component: ue, phase: x(Ye), compiled: ce, baseMs: k },
    commit: { priority: x(qe) },
    effects: { boundary: I, passiveMs: k },
    "component-effects": { component: ue, phase: x(Je) },
  }),
  Vt = pe({
    settle: { entrypointId: I, chunk: x(ze), cached: ce },
    presented: { ticket: _, entrypointId: I, surface: tn, commitClass: x(de) },
    publish: { store: I, commit: x(de), version: _, listeners: _ },
    rpc: { edge: I, method: I, ok: ce, failureCode: nn(I) },
    event: { event: I, interactionId: _, inputDelayMs: k, processingMs: k },
    "long-animation-frame": {
      blockingMs: k,
      renderMs: k,
      styleAndLayoutMs: k,
      scripts: _,
    },
  }),
  rn = (e) =>
    q(e, {
      id: _,
      parent: nn(_),
      startMs: k,
      durationMs: k,
      selfMs: k,
      detail: Ft,
    }),
  on = (e) => q(e, { startMs: k, durationMs: k, detail: Vt }),
  an = {
    version: Ot,
    lastCommitMs: Z,
    commitCount: _,
    renderSelfMs: Z,
    sampleRate: Lt,
  },
  Ia = {
    ...an,
    id: en,
    root: Nt,
    endMs: k,
    closedBy: x(le),
    spans: ee(rn),
    folded: _,
    dropped: _,
  },
  Oa = { ticket: _, measures: ee(on), presentedMs: Z, dismissedMs: Z },
  La = {
    ...an,
    id: en,
    startMs: k,
    endMs: k,
    closedBy: x(Xe),
    spans: ee(rn),
    measures: ee(on),
    folded: _,
    dropped: _,
  };
var ws = process.type === "browser" ? Ue(U.app) : () => "unknown";
function sn(e) {
  return {
    invoke: (n, t) => e.invoke(n, t),
    on: (n, t) => {
      let i = (o, a) => {
        t(a);
      };
      return (
        e.on(n, i),
        () => {
          e.off(n, i);
        }
      );
    },
  };
}
function dn(e) {
  return e != null ? sn(e.ipcRenderer) : sn(U.ipcRenderer);
}
r();
r();
r();
function Ut(e) {
  return e === null ? "null" : Array.isArray(e) ? "array" : typeof e;
}
function ln(e, n, t) {
  return { ok: !1, path: e, expected: n, received: Ut(t) };
}
function Ht(e) {
  return e.optional === !0;
}
function cn(e, n) {
  return {
    expects: e,
    check: n,
    "~standard": {
      version: 1,
      vendor: "dune",
      validate: (t) => {
        let i = n(t, []);
        return i.ok
          ? { value: i.value }
          : {
              issues: [
                {
                  message: `must be ${i.expected}, got ${i.received}`,
                  path: i.path,
                },
              ],
            };
      },
    },
  };
}
function jt(e, n, t) {
  if (!w(n)) return ln(t, "object", n);
  let i = [];
  for (let [o, a] of Object.entries(e)) {
    let s = Object.hasOwn(n, o) ? n[o] : void 0;
    if (s === void 0 && Ht(a)) continue;
    let d = a.check(s, [...t, o]);
    if (!d.ok) return d;
    i.push([o, d.value]);
  }
  return { ok: !0, value: Object.fromEntries(i) };
}
function fe() {
  return cn("string", (e, n) =>
    typeof e == "string" ? { ok: !0, value: e } : ln(n, "string", e),
  );
}
function Y(e) {
  return cn("object", (n, t) => jt(e, n, t));
}
function Gt(e) {
  let n = e["~standard"];
  return (
    typeof n == "object" &&
    n !== null &&
    n.version === 1 &&
    typeof n.validate == "function"
  );
}
var ne = class extends Error {
  constructor(n) {
    (super(
      `rpcMethod().args: field "${n}" is not an rpc field validator; pass rpc* combinators or one Standard Schema v1 value.`,
    ),
      (this.name = "RpcMethodDeclarationError"));
  }
};
function te() {
  return {
    noArgs: { schema: null },
    args: (e) => {
      if (Gt(e)) return { schema: e };
      for (let [n, t] of Object.entries(e))
        if (typeof t?.check != "function") throw new ne(n);
      return { schema: Y(e) };
    },
  };
}
function me(e, n) {
  return Object.freeze({
    kind: "rpc-edge",
    edge: e,
    methods: n.methods,
    hasEvents: n.events != null,
  });
}
r();
r();
var Kt = "__DUNE_DEVTOOLS_HOOK__";
function Wt(e) {
  return w(e) && e.version === 1 && typeof e.register == "function";
}
function un(e = globalThis) {
  let n = w(e) ? e[Kt] : void 0;
  return Wt(n) ? n : null;
}
var fn = "edge/unknown-method",
  ye = "edge/transport-failed";
var mn = "edge/handler-failed";
var L = class extends Error {
  code;
  detail;
  constructor(n) {
    (super(`${n.code}: ${n.detail}`),
      (this.name = "EdgeCallFailure"),
      (this.code = n.code),
      (this.detail = n.detail));
  }
};
function pn(e) {
  return typeof e != "object" || e == null || !("ok" in e)
    ? !1
    : typeof e.ok == "boolean";
}
function $t(e, n) {
  return `dune-rpc:${e}:m:${n}`;
}
function yn(e, n) {
  return `dune-rpc:${e}:e:${n}`;
}
function qt(e) {
  return `dune-rpc:${e}:probe`;
}
var Qs = Y({});
function ge(e, n, t = {}) {
  let i = {},
    o = t.measures ?? null,
    a = async (u, p) => {
      let m = p instanceof Error ? p.message : String(p),
        f;
      try {
        f = await n.invoke(qt(e.edge), u);
      } catch {
        return new L({ code: ye, detail: m });
      }
      return pn(f) && !f.ok && f.failure.code === fn
        ? new L(f.failure)
        : new L({ code: ye, detail: m });
    },
    s = async (u, p) => {
      let m;
      try {
        m = await n.invoke($t(e.edge, u), p);
      } catch (f) {
        throw await a(u, f);
      }
      if (!pn(m))
        throw new L({
          code: mn,
          detail: "The edge replied outside its envelope.",
        });
      if (m.ok) return m.value;
      throw new L(m.failure);
    },
    d = (u, p) => {
      if (o == null) return s(u, p);
      let m = o.now(),
        f = (c, y) => {
          o.record({
            startMs: m,
            durationMs: o.now() - m,
            detail: {
              kind: "rpc",
              edge: e.edge,
              method: u,
              ok: c,
              failureCode: y,
            },
          });
        };
      return s(u, p).then(
        (c) => (f(!0, null), c),
        (c) => {
          throw (f(!1, c instanceof L ? c.code : null), c);
        },
      );
    };
  for (let [u, { schema: p }] of Object.entries(e.methods))
    i[u] = p === null ? () => d(u, {}) : (m) => d(u, m);
  return (
    e.hasEvents &&
      (i.subscribe = (u) => {
        let p = [];
        for (let [m, f] of Object.entries(u))
          f != null && p.push(n.on(yn(e.edge, m), f));
        return () => {
          for (let m of p) m();
        };
      }),
    un()?.register({
      kind: "rpc-edge",
      role: "bridge",
      declaration: e,
      trust: [],
    }),
    i
  );
}
r();
r();
r();
var Ee = [
    { code: "KeyA", keysym: 97, forceShift: !1 },
    { code: "KeyC", keysym: 99, forceShift: !1 },
    { code: "KeyV", keysym: 118, forceShift: !0 },
    { code: "KeyX", keysym: 120, forceShift: !1 },
    { code: "KeyZ", keysym: 122, forceShift: !1 },
  ],
  re = 65507,
  oe = 65505,
  Re = [
    [65511, "MetaLeft"],
    [65512, "MetaRight"],
    [65513, "AltLeft"],
    [65514, "AltRight"],
    [65515, "SuperLeft"],
    [65516, "SuperRight"],
  ];
function be() {
  let e = "",
    n = "";
  return {
    shouldSendHostText(t) {
      return t.length > 0 && t !== e && t !== n;
    },
    commitHostText(t) {
      e = t;
    },
    resolveVmText(t) {
      return t.length === 0 || t === e || t === n ? null : ((n = t), t);
    },
  };
}
r();
var gn = me("box-vnc", {
  methods: {
    readClipboard: te().noArgs,
    writeClipboard: te().args({ text: fe() }),
  },
});
r();
var En = "sand:vnc-host-key";
r();
var Rn = "sand:vnc-interactive",
  bn = "sand:vnc-accepts-input";
r();
r();
function ke(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
var kn = "sand:vnc-liveness",
  ve = 1e4,
  vn = 3;
r();
var he = "sand:vnc-viewer-visible";
r();
r();
var D = [
  { member: "keyEvent", modulePath: "./core/rfb.js" },
  { member: "QEMUExtendedKeyEvent", modulePath: "./core/rfb.js" },
  { member: "pointerEvent", modulePath: "./core/rfb.js" },
  { member: "_damage", modulePath: "./core/display.js" },
  { member: "_recvMessage", modulePath: "./core/websock.js" },
  { member: "fbUpdateRequest", modulePath: "./core/rfb.js" },
  { member: "flip", modulePath: "./core/display.js" },
];
var hn = {
  low: 6,
  high: 8,
  raiseAtMbps: 15,
  lowerBelowMbps: 11,
  maxEstimateMbps: 30,
  sampleWeight: 0.25,
  sampleMinBytes: 96 * 1024,
  sampleMinMessages: 3,
  raiseHoldMs: 1e4,
  maxRaiseHoldMs: 16e4,
};
function Yt(e) {
  return {
    estimateMbps: null,
    raiseNotBeforeMs: 0,
    raiseHoldMs: e.raiseHoldMs,
  };
}
function Jt(e, { quality: n, link: t, sampleMbps: i, nowMs: o }) {
  let a =
      t.estimateMbps == null
        ? i
        : t.estimateMbps + e.sampleWeight * (i - t.estimateMbps),
    s = Math.min(a, e.maxEstimateMbps);
  return n > e.low && s < e.lowerBelowMbps
    ? {
        quality: e.low,
        estimateMbps: s,
        raiseNotBeforeMs: o + t.raiseHoldMs,
        raiseHoldMs: Math.min(t.raiseHoldMs * 2, e.maxRaiseHoldMs),
      }
    : n < e.high && s >= e.raiseAtMbps && o >= t.raiseNotBeforeMs
      ? { ...t, quality: e.high, estimateMbps: s }
      : { ...t, quality: n, estimateMbps: s };
}
var Se = "__sandVncAdaptiveQuality";
function zt(e, n, t, i, o, a) {
  let s = a.guestWindow();
  if (s[o] != null) return Promise.resolve();
  let d = (g) => typeof g == "function",
    u = (g) => {
      let E = typeof g == "object" && g != null && "data" in g ? g.data : null;
      return E instanceof ArrayBuffer ? E.byteLength : 0;
    },
    p = { bytes: 0, messages: 0, firstAtMs: 0, lastAtMs: 0 },
    m = i,
    f = !1,
    c = !1,
    y = () => null,
    R = [],
    b = (g, E, v, A) => {
      R.push(() => {
        g[E] === A && (g[E] = v);
      });
    },
    F = (g) => {
      let E = a.now();
      (p.messages === 0 && (p.firstAtMs = E),
        (p.messages += 1),
        (p.bytes += u(g)),
        (p.lastAtMs = E));
    },
    h = {
      remove() {
        (s[o] === h && delete s[o], (c = !0));
        for (let E of R.splice(0)) E();
        let g = y();
        g != null &&
          typeof g.qualityLevel == "number" &&
          g.qualityLevel !== e.low &&
          (g.qualityLevel = e.low);
      },
    };
  s[o] = h;
  let O = () => {
      let g = p;
      p = { bytes: 0, messages: 0, firstAtMs: 0, lastAtMs: 0 };
      let E = y(),
        v = g.lastAtMs - g.firstAtMs;
      if (
        E == null ||
        g.bytes < e.sampleMinBytes ||
        g.messages < e.sampleMinMessages ||
        v <= 0
      )
        return;
      let A = (g.bytes * 8) / (v * 1e3),
        S = t(e, {
          quality: E.qualityLevel,
          link: m,
          sampleMbps: A,
          nowMs: g.lastAtMs,
        });
      ((m = S),
        S.quality !== E.qualityLevel &&
          ((f = S.quality > E.qualityLevel), (E.qualityLevel = S.quality)));
    },
    T = (g) => {
      let E = g?._sock,
        v = E?._websocket;
      if (
        !(E?.readyState === "open" || E?.readyState === "connecting") ||
        v == null ||
        typeof v.onmessage != "function"
      )
        return;
      let S = v.onmessage,
        K = function (Me) {
          return (F(Me), S.call(this, Me));
        };
      ((v.onmessage = K), b(v, "onmessage", S, K));
    },
    V = Promise.all([a.ui(), a.websock()]).then(([g, E]) => {
      if (c) return;
      y = () => g.default?.rfb;
      let v = E.default?.prototype,
        A = v?.[n.receiveMember];
      if (v != null && d(A)) {
        let S = function (...K) {
          return (F(K[0]), A.apply(this, K));
        };
        ((v[n.receiveMember] = S), b(v, n.receiveMember, A, S));
      }
      T(y());
    }),
    G = a.rfb().then((g) => {
      if (c) return;
      let E = g.default?.messages,
        v = E?.[n.requestMember];
      if (E == null || !d(v)) return;
      let A = function (...S) {
        return (
          O(),
          f && S[1] === !0 && ((f = !1), (S[1] = !1)),
          v.apply(this, S)
        );
      };
      ((E[n.requestMember] = A), b(E, n.requestMember, v, A));
    });
  return Promise.all([V, G]);
}
function Sn() {
  let e = D[4],
    n = D[5],
    t = { receiveMember: e.member, requestMember: n.member },
    i = Yt(hn);
  return `(${zt.toString()})(${JSON.stringify(hn)}, ${JSON.stringify(t)}, ${Jt.toString()}, ${JSON.stringify(i)}, ${JSON.stringify(Se)}, {
    now: () => performance.now(),
    websock: () => import(${JSON.stringify(e.modulePath)}),
    rfb: () => import(${JSON.stringify(n.modulePath)}),
    ui: () => import("./app/ui.js"),
    guestWindow: () => window,
  })`;
}
function _n() {
  return `window.${Se} && window.${Se}.remove()`;
}
r();
function xn(e) {
  return `
    import("./app/ui.js")
      .then(function (m) {
        var rfb = m && m.default && m.default.rfb;
        var text = ${JSON.stringify(e)};
        if (rfb && typeof rfb.clipboardPasteFrom === "function" && text) {
          rfb.clipboardPasteFrom(text);
          return true;
        }
        return false;
      })
      .catch(function () {
        return false;
      });
  `;
}
function Tn(e, n) {
  return n && e.length > 0 ? e : null;
}
r();
r();
var _e = "__sandVncFrameStamp";
var H = "__sandVncFrameHold";
function wn(e) {
  let n = D[5],
    t = D[6];
  return `
    (function () {
      if (window.${H}) return;
      var pace = ${JSON.stringify(e)};
      var hold = { isHeld: false, request: null, minIntervalMs: pace.minIntervalMs, pacedAt: -Infinity, receivedBytes: 0, unpacedLeft: 0, isPastFirstRequest: false, timer: null };
      var countedChannels = new WeakSet();
      function countReceivedBytes(sock) {
        var channel = sock && sock._websocket;
        if (!channel || typeof channel.onmessage !== "function" || countedChannels.has(channel)) return;
        countedChannels.add(channel);
        var receive = channel.onmessage;
        channel.onmessage = function (event) {
          hold.receivedBytes += (event.data && event.data.byteLength) || 0;
          return receive.apply(this, arguments);
        };
      }
      function flush() {
        var request = hold.request;
        if (hold.isHeld || request == null) return;
        var isIncremental = request.args[1] === true;
        var wait = isIncremental ? hold.pacedAt + hold.minIntervalMs - performance.now() : 0;
        var isUnpaced = wait > 0 && request.followsSmallUpdate && hold.unpacedLeft > 0;
        if (wait > 0 && !isUnpaced) {
          if (hold.timer == null) {
            hold.timer = setTimeout(function () {
              hold.timer = null;
              flush();
            }, Math.ceil(wait));
          }
          return;
        }
        clearTimeout(hold.timer);
        hold.timer = null;
        hold.request = null;
        if (isUnpaced) hold.unpacedLeft -= 1;
        else if (isIncremental) {
          if (hold.isPastFirstRequest) hold.pacedAt = performance.now();
          hold.isPastFirstRequest = true;
        }
        request.send.apply(request.messages, request.args);
      }
      hold.set = function (isHeld) {
        hold.isHeld = isHeld;
        if (isHeld) return;
        hold.pacedAt = -Infinity;
        flush();
      };
      hold.pace = function (minIntervalMs) {
        hold.minIntervalMs = minIntervalMs;
        flush();
      };
      window.${H} = hold;
      var paced = import(${JSON.stringify(n.modulePath)}).then(function (m) {
        var messages = m && m.default && m.default.messages;
        if (!messages || typeof messages.${n.member} !== "function") {
          throw new Error("noVNC RFB lacks messages.${n.member}");
        }
        var send = messages.${n.member};
        messages.${n.member} = function (sock, incremental) {
          if (incremental !== true) hold.isPastFirstRequest = false;
          countReceivedBytes(sock);
          var updateBytes = hold.receivedBytes;
          hold.receivedBytes = 0;
          if (updateBytes >= pace.largeUpdateBytes) hold.unpacedLeft = pace.smallUpdatesAfterLarge;
          hold.request = {
            send: send,
            messages: this,
            args: arguments,
            followsSmallUpdate: updateBytes < pace.smallUpdateBytes,
          };
          flush();
        };
      });
      var stamped = import(${JSON.stringify(t.modulePath)}).then(function (m) {
        var display = m && m.default && m.default.prototype;
        if (!display || typeof display.${t.member} !== "function") {
          throw new Error("noVNC Display lacks prototype.${t.member}");
        }
        var draw = display.${t.member};
        display.${t.member} = function () {
          window.${_e} = Math.random();
          return draw.apply(this, arguments);
        };
        window.${_e} = Math.random();
      });
      return Promise.all([paced, stamped]);
    })();
  `;
}
function Cn(e) {
  return `window.${H} && window.${H}.set(${e})`;
}
function Mn(e) {
  return `window.${H} && window.${H}.pace(${e.minIntervalMs})`;
}
r();
var Xt = "sandVncImeInput",
  J = "__sandVncImeField";
function An() {
  return `
    (function () {
      if (window.${J}) return;
      var isRemoved = false;
      var teardown = function () {};
      window.${J} = {
        remove: function () {
          isRemoved = true;
          delete window.${J};
          teardown();
        },
      };

      var FIELD_ID = ${JSON.stringify(Xt)};
      var XK_RETURN = 65293;
      var ui = null;
      var keysyms = null;

      function liveRfb() {
        var rfb = ui && ui.rfb;
        return rfb && typeof rfb.sendKey === "function" ? rfb : null;
      }

      function keysymOf(codepoint) {
        if (codepoint === 0x0a || codepoint === 0x0d) return XK_RETURN;
        if (codepoint < 0x20) return null;
        return keysyms.lookup(codepoint);
      }

      function sendText(text) {
        var rfb = liveRfb();
        if (!rfb) return;
        var chars = Array.from(text);
        for (var i = 0; i < chars.length; i++) {
          var keysym = keysymOf(chars[i].codePointAt(0));
          if (keysym === null) continue;
          rfb.sendKey(keysym, null, true);
          rfb.sendKey(keysym, null, false);
        }
      }

      function isViewerCanvas(node) {
        return node instanceof HTMLCanvasElement && node.closest("#noVNC_container") !== null;
      }

      function hostImeOwnsPhysicalKey(e) {
        if (e.ctrlKey || e.metaKey) return false;
        if (e.key === "Shift" || e.key === "Alt") return false;
        return e.isComposing || e.keyCode === 229 || e.key === "Process" || e.key === "Dead";
      }

      function install(Keyboard) {
        if (isRemoved) return;
        var field = document.createElement("textarea");
        field.id = FIELD_ID;
        field.tabIndex = -1;
        field.setAttribute("aria-label", "Remote desktop keyboard input");
        field.setAttribute("autocapitalize", "off");
        field.setAttribute("autocomplete", "off");
        field.setAttribute("autocorrect", "off");
        field.setAttribute("spellcheck", "false");
        field.style.cssText =
          "position:fixed;left:0;top:0;width:1px;height:1px;margin:0;padding:0;border:0;" +
          "opacity:0;overflow:hidden;resize:none;pointer-events:none;";
        document.body.appendChild(field);

        field.addEventListener(
          "keydown",
          function (e) {
            if (!hostImeOwnsPhysicalKey(e)) return;
            if (e.key === "Tab") e.preventDefault();
            e.stopImmediatePropagation();
          },
          true,
        );

        var keyboard = new Keyboard(field);
        keyboard.onkeyevent = function (keysym, code, down) {
          var rfb = liveRfb();
          if (rfb) rfb.sendKey(keysym, code, down);
        };
        keyboard.grab();

        function moveCandidateWindowAnchorTo(e) {
          if (!isViewerCanvas(e.target)) return;
          field.style.left = e.clientX + "px";
          field.style.top = e.clientY + "px";
        }

        field.addEventListener("compositionend", function (e) {
          if (typeof e.data === "string") sendText(e.data);
          field.value = "";
        });
        field.addEventListener("beforeinput", function (e) {
          if (e.isComposing || e.inputType === "insertCompositionText") return;
          e.preventDefault();
          if (e.inputType === "insertText" && typeof e.data === "string") {
            sendText(e.data);
          } else if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") {
            sendText("\\n");
          }
        });
        field.addEventListener("input", function (e) {
          if (!e.isComposing) field.value = "";
        });

        function focusFieldForCanvas(e) {
          if (isViewerCanvas(e.target)) field.focus({ preventScroll: true });
        }
        document.addEventListener("focus", focusFieldForCanvas, true);
        document.addEventListener("mousedown", moveCandidateWindowAnchorTo, true);

        if (isViewerCanvas(document.activeElement)) field.focus({ preventScroll: true });

        teardown = function () {
          keyboard.ungrab();
          document.removeEventListener("focus", focusFieldForCanvas, true);
          document.removeEventListener("mousedown", moveCandidateWindowAnchorTo, true);
          var hadFocus = document.activeElement === field;
          field.remove();
          var canvas = document.querySelector("#noVNC_container canvas");
          if (hadFocus && canvas) canvas.focus({ preventScroll: true });
        };
      }

      return Promise.all([
        import("./app/ui.js"),
        import("./core/input/keyboard.js"),
        import("./core/input/keysymdef.js"),
      ]).then(function (modules) {
        ui = modules[0] && modules[0].default;
        var Keyboard = modules[1] && modules[1].default;
        keysyms = modules[2] && modules[2].default;
        if (!ui || !keysyms || typeof Keyboard !== "function") {
          throw new Error("noVNC modules lack Keyboard, keysymdef, or UI");
        }
        if (document.body) {
          install(Keyboard);
        } else {
          document.addEventListener("DOMContentLoaded", function () { install(Keyboard); }, { once: true });
        }
      });
    })();
  `;
}
function In() {
  return `window.${J} && window.${J}.remove()`;
}
r();
var N = "__sandVncLivenessBeacon";
function On() {
  let [e, n, t, i, o] = D;
  return `
    (function () {
      if (window.${N}) return;
      var counters = { keys: 0, clicks: 0, moves: 0, drawOps: 0, inBytes: 0 };
      var restores = [];
      function isInstalled() {
        return window.${N} === counters;
      }
      function restoreOnRemove(owner, member, original) {
        var wrapper = owner[member];
        restores.push(function () {
          if (owner[member] === wrapper) owner[member] = original;
        });
      }
      Object.defineProperty(counters, "remove", {
        value: function () {
          if (isInstalled()) delete window.${N};
          restores.splice(0).forEach(function (restore) { restore(); });
        },
      });
      window.${N} = counters;
      var PRIMARY_BUTTON_MASK_BITS = 0x07;
      var lastButtonMask = 0;
      function countInBytes(e) {
        counters.inBytes += (e && e.data && e.data.byteLength) || 0;
      }
      import(${JSON.stringify(e.modulePath)}).then(function (m) {
        if (!isInstalled()) return;
        var messages = m.default.messages;
        var keyEvent = messages.${e.member};
        messages.${e.member} = function (sock, keysym, down) {
          if (down) counters.keys += 1;
          return keyEvent.apply(this, arguments);
        };
        restoreOnRemove(messages, "${e.member}", keyEvent);
        if (typeof messages.${n.member} === "function") {
          var qemuKeyEvent = messages.${n.member};
          messages.${n.member} = function (sock, keysym, down) {
            if (down) counters.keys += 1;
            return qemuKeyEvent.apply(this, arguments);
          };
          restoreOnRemove(messages, "${n.member}", qemuKeyEvent);
        }
        var pointerEvent = messages.${t.member};
        messages.${t.member} = function (sock, x, y, mask) {
          if (mask & ~lastButtonMask & PRIMARY_BUTTON_MASK_BITS) counters.clicks += 1;
          else counters.moves += 1;
          lastButtonMask = mask;
          return pointerEvent.apply(this, arguments);
        };
        restoreOnRemove(messages, "${t.member}", pointerEvent);
      }).catch(function () {});
      import(${JSON.stringify(i.modulePath)}).then(function (m) {
        if (!isInstalled()) return;
        var display = m.default.prototype;
        var damage = display.${i.member};
        display.${i.member} = function () {
          counters.drawOps += 1;
          return damage.apply(this, arguments);
        };
        restoreOnRemove(display, "${i.member}", damage);
      }).catch(function () {});
      Promise.all([import(${JSON.stringify(o.modulePath)}), import("./app/ui.js")]).then(function (modules) {
        if (!isInstalled()) return;
        var websock = modules[0].default.prototype;
        var recvMessage = websock.${o.member};
        websock.${o.member} = function (e) {
          countInBytes(e);
          return recvMessage.apply(this, arguments);
        };
        restoreOnRemove(websock, "${o.member}", recvMessage);
        var ui = modules[1].default;
        var sock = ui && ui.rfb && ui.rfb._sock;
        var channel = sock && sock._websocket;
        var isOpen = sock && (sock.readyState === "open" || sock.readyState === "connecting");
        if (!isOpen || !channel || typeof channel.onmessage !== "function") return;
        var receive = channel.onmessage;
        channel.onmessage = function (e) {
          countInBytes(e);
          return receive.apply(this, arguments);
        };
        restoreOnRemove(channel, "onmessage", receive);
      }).catch(function () {});
    })();
  `;
}
function Ln() {
  return `JSON.stringify(window.${N} || null)`;
}
function Pn() {
  return `window.${N} && window.${N}.remove()`;
}
function z(e) {
  return typeof e == "number" && Number.isFinite(e) && e >= 0;
}
function Dn(e) {
  if (typeof e != "string") return null;
  let n = JSON.parse(e);
  return !ke(n) ||
    !z(n.keys) ||
    !z(n.clicks) ||
    !z(n.moves) ||
    !z(n.drawOps) ||
    !z(n.inBytes)
    ? null
    : {
        keys: n.keys,
        clicks: n.clicks,
        moves: n.moves,
        drawOps: n.drawOps,
        inBytes: n.inBytes,
      };
}
function Nn() {
  let e = null,
    n = [],
    t = null,
    i = !1;
  function o() {
    ((e = null), (n = []), (t = null), (i = !1));
  }
  function a(d, u) {
    (o(), (e = u), (t = d));
  }
  function s(d, u) {
    if (e == null) return (a(d, u), null);
    let p = {
      atMs: d,
      keys: u.keys - e.keys,
      clicks: u.clicks - e.clicks,
      moves: u.moves - e.moves,
      drawOps: u.drawOps - e.drawOps,
      inBytes: u.inBytes - e.inBytes,
    };
    if (
      p.keys < 0 ||
      p.clicks < 0 ||
      p.moves < 0 ||
      p.drawOps < 0 ||
      p.inBytes < 0
    )
      return (a(d, u), null);
    ((e = u), n.push(p));
    let m = d - ve;
    if (
      ((n = n.filter((h) => h.atMs > m)),
      p.drawOps > 0 && (i = !1),
      i || t == null || d - t < ve)
    )
      return null;
    let f = 0,
      c = 0,
      y = 0,
      R = 0,
      b = 0;
    for (let h of n)
      ((f += h.keys),
        (c += h.clicks),
        (y += h.moves),
        (R += h.drawOps),
        (b += h.inBytes));
    if (f + c < vn || R > 0 || b > 0) return null;
    i = !0;
    let F = n.find((h) => h.keys + h.clicks > 0);
    return {
      phase: "post_connect",
      stallMs: d - (F?.atMs ?? d),
      keys: f,
      clicks: c,
      moves: y,
      inBytes: b,
    };
  }
  return { sample: s, reset: o };
}
r();
function Fn() {
  let e = !1;
  return {
    isVisible: () => e,
    update(n) {
      let t = n === !0,
        i = t && !e;
      return ((e = t), i);
    },
  };
}
var we = {};
Ae(we, {
  getErrorMessage: () => C,
  getIpcRenderer: () => ie,
  getWebFrame: () => Yn,
  installSandBrowserPreload: () => ar,
  logWarn: () => M,
});
r();
r();
var Vn = "sand:mouse-history-navigation";
function xe(e) {
  return e === 3 ? -1 : e === 4 ? 1 : null;
}
function Te(e) {
  (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
}
function Bn(e, n) {
  let t = !1,
    i = (s) => {
      let d = xe(s.button);
      d == null || s.isTrusted === !1 || ((t = !0), Te(s), n(d));
    },
    o = (s) => {
      !t || xe(s.button) == null || Te(s);
    },
    a = (s) => {
      !t || xe(s.button) == null || (Te(s), (t = !1));
    };
  return (
    e.addEventListener("mousedown", i, !0),
    e.addEventListener("mouseup", o, !0),
    e.addEventListener("auxclick", a, !0),
    () => {
      (e.removeEventListener("mousedown", i, !0),
        e.removeEventListener("mouseup", o, !0),
        e.removeEventListener("auxclick", a, !0));
    }
  );
}
r();
var Un = 6e4;
function Hn(e) {
  return e.policy
    .run(() => e.call)
    .catch((n) => {
      throw n instanceof B
        ? (e.reportStall({ method: e.method, since: e.since }),
          e.buildStallError())
        : n;
    });
}
r();
function C(e) {
  return e instanceof Error ? e.message : void 0;
}
function M(...e) {
  console.warn("[sand-webview-preload]", ...e);
}
var jn = [
  ".okta.com",
  ".okta-emea.com",
  ".oktapreview.com",
  ".duosecurity.com",
  ".login.microsoftonline.com",
  ".onelogin.com",
  ".auth0.com",
  ".pingidentity.com",
  ".rippling.com",
];
var Gn = !1,
  Wn = null,
  $n = null;
function qn() {
  if (!Gn) {
    Gn = !0;
    try {
      let e = require("electron");
      ((Wn = e.ipcRenderer ?? null), ($n = e.webFrame ?? null));
    } catch (e) {
      M("electron module unavailable", C(e));
    }
  }
}
function ie() {
  return (qn(), Wn);
}
function Yn() {
  return (qn(), $n);
}
function Qt(e) {
  if (typeof e != "string" || e.length === 0) return !1;
  for (let n = 0; n < jn.length; n++) if (e.endsWith(jn[n])) return !0;
  return !1;
}
function Zt() {
  let e = Yn();
  if (e == null || typeof location > "u" || !Qt(location.hostname)) return;
  e.executeJavaScript(
    `
    (function () {
      var permissions = navigator && navigator.permissions;
      if (!permissions || typeof permissions.query !== "function") return;
      if (permissions.__sandLocalNetworkPolyfill) return;
      permissions.__sandLocalNetworkPolyfill = true;
      var originalQuery = permissions.query.bind(permissions);
      permissions.query = function (descriptor) {
        var name = descriptor && descriptor.name;
        if (name === "local-network-access" || name === "local-network") {
          var status = new EventTarget();
          Object.defineProperties(status, {
            name: { value: name },
            state: { value: "granted" },
            onchange: { value: null, writable: true },
          });
          return Promise.resolve(status);
        }
        return originalQuery(descriptor);
      };
    })();
  `,
  ).catch((t) => {
    M("local network polyfill injection failed", C(t));
  });
}
function er() {
  try {
    return new DOMException("Passkey request stalled", "NotAllowedError");
  } catch {
    let n = new Error("Passkey request stalled");
    return ((n.name = "NotAllowedError"), n);
  }
}
var nr = W({ name: "sand-webview-passkey-stall", timeoutMs: Un });
function Kn(e, n, t) {
  return function (...o) {
    let a = Date.now(),
      s;
    try {
      let d = t.apply(navigator.credentials, o);
      s = Promise.resolve(d);
    } catch (d) {
      return Promise.reject(d);
    }
    return Hn({
      policy: nr,
      method: n,
      since: a,
      call: s,
      reportStall: (d) => {
        try {
          e.sendToHost("sand:browser-passkey-stalled", d);
        } catch (u) {
          M("passkey stall send failed", C(u));
        }
      },
      buildStallError: er,
    });
  };
}
function tr() {
  if (typeof navigator > "u") return;
  let e = ie();
  if (e != null && navigator.credentials) {
    if (typeof navigator.credentials.create == "function") {
      let n = navigator.credentials.create.bind(navigator.credentials);
      navigator.credentials.create = Kn(e, "create", n);
    }
    if (typeof navigator.credentials.get == "function") {
      let n = navigator.credentials.get.bind(navigator.credentials);
      navigator.credentials.get = Kn(e, "get", n);
    }
  }
}
function rr() {
  typeof window > "u" ||
    (window.__sandDialogOverridesApplied !== !0 &&
      ((window.alert = function () {}),
      (window.confirm = function () {
        return !0;
      }),
      (window.prompt = function () {
        return null;
      }),
      (window.__sandDialogOverridesApplied = !0)));
}
function or() {
  let e = ie();
  if (e == null) return;
  let n = e;
  if (typeof window > "u" || typeof location > "u") return;
  let t = location.origin;
  function i() {
    try {
      n.sendToHost("sand:browser-popup-closed", { url: location.href });
    } catch (o) {
      M("popup-closed send failed", C(o));
    }
  }
  (window.addEventListener("beforeunload", i),
    window.addEventListener("pagehide", i),
    window.addEventListener("pageshow", function (a) {
      if (!(!a || a.persisted !== !0) && location.origin === t)
        try {
          n.sendToHost("sand:browser-origin-return", {
            origin: t,
            currentUrl: location.href,
          });
        } catch (s) {
          M("origin-return send failed", C(s));
        }
    }));
}
function ir() {
  let e = ie();
  e == null ||
    typeof window > "u" ||
    Bn(window, (n) => {
      e.send(Vn, n);
    });
}
function ar() {
  try {
    ir();
  } catch (e) {
    M("mouse history install failed", C(e));
  }
  try {
    Zt();
  } catch (e) {
    M("local network polyfill install failed", C(e));
  }
  try {
    tr();
  } catch (e) {
    M("webauthn polyfill install failed", C(e));
  }
  try {
    rr();
  } catch (e) {
    M("dialog stubs install failed", C(e));
  }
  try {
    or();
  } catch (e) {
    M("ipc wiring install failed", C(e));
  }
}
function sr(e) {
  let n = e.getIpcRenderer();
  return n == null ? null : ge(gn, dn({ ipcRenderer: n }));
}
var Ce = {
    minIntervalMs: 500,
    largeUpdateBytes: 8 * 1024,
    smallUpdateBytes: 1024,
    smallUpdatesAfterLarge: 4,
  },
  Jn = { ...Ce, minIntervalMs: 0 },
  X = "__sandVncMacKeys";
function j() {
  return typeof location < "u" && location.pathname.endsWith("/vnc.html");
}
function dr() {
  if (!j()) return !1;
  try {
    return new URLSearchParams(location.search).get("sandInteractive") === "1";
  } catch {
    return !1;
  }
}
function zn(e) {
  let n = [],
    t = e;
  return {
    isOn: () => t,
    turn(i) {
      if (i === t) return;
      t = i;
      let o = i ? n : n.slice().reverse();
      for (let a of o) (a.stop?.(), (a.stop = i ? a.start() : null));
    },
    whileOn(i) {
      n.push({ start: i, stop: t ? i() : null });
    },
  };
}
function lr(e) {
  let n = dr(),
    t = !0,
    i = zn(n),
    o = zn(n);
  return (
    e != null &&
      j() &&
      (e.on(Rn, (a, s) => {
        typeof s == "boolean" &&
          ((n = s), s ? (i.turn(!0), o.turn(t)) : (o.turn(!1), i.turn(!1)));
      }),
      e.on(bn, (a, s) => {
        typeof s == "boolean" && ((t = s), o.turn(n && t));
      }),
      typeof window < "u" &&
        window.addEventListener(
          "pagehide",
          () => {
            (o.turn(!1), i.turn(!1));
          },
          { once: !0 },
        )),
    { interactivity: i, input: o }
  );
}
function Xn() {
  if (typeof document > "u") return null;
  let e = document.getElementById("noVNC_clipboard_text");
  return e instanceof HTMLTextAreaElement ? e : null;
}
function cr({ getErrorMessage: e, getWebFrame: n, logWarn: t }) {
  if (typeof location > "u" || !location.pathname.endsWith("/vnc.html")) return;
  let i = `
    #noVNC_control_bar,
    #noVNC_control_bar_handle,
    #noVNC_control_bar_anchor,
    #noVNC_status,
    .noVNC_logo {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }
    :root:not(.noVNC_loading):not(.noVNC_connecting):not(.noVNC_disconnecting):not(.noVNC_reconnecting) #noVNC_transition{display:none!important}
  `;
  try {
    n()?.insertCSS(i);
  } catch (a) {
    t("noVNC CSS injection failed", e(a));
  }
  function o() {
    document
      .getElementById("noVNC_control_bar")
      ?.classList.remove("noVNC_open");
  }
  typeof document > "u" ||
    (o(),
    document.addEventListener("DOMContentLoaded", o, { once: !0 }),
    window.addEventListener("load", o, { once: !0 }));
}
function ur(e, n) {
  let { getErrorMessage: t, getIpcRenderer: i, getWebFrame: o, logWarn: a } = e,
    s = i(),
    d = sr(e);
  if (s == null || d == null) return;
  let u = d;
  if (typeof window > "u" || typeof document > "u" || !j()) return;
  let p = 500,
    m = 200,
    f = be(),
    c = 0,
    y = Fn();
  s.on(he, (O, T) => {
    y.update(T) && n.isOn() && b();
  });
  function R() {
    if (!y.isVisible()) return;
    let O = Xn();
    if (O == null) return;
    let T = f.resolveVmText(O.value);
    T != null &&
      u.writeClipboard({ text: T }).catch((V) => {
        a("vnc clipboard write failed", t(V));
      });
  }
  function b() {
    if (!y.isVisible()) return;
    let O = Date.now();
    O - c < m ||
      ((c = O),
      u
        .readClipboard()
        .then((T) => {
          if (!f.shouldSendHostText(T)) return;
          let V = o();
          V?.executeJavaScript(xn(T))
            .then((G) => {
              let g = Tn(T, G === !0);
              if (g == null) return;
              f.commitHostText(g);
              let E = Xn();
              E != null && (E.value = g);
            })
            .catch((G) => {
              a("vnc clipboard paste failed", t(G));
            });
        })
        .catch((T) => {
          a("vnc clipboard read failed", t(T));
        }));
  }
  let F = $({ name: "vnc-clipboard-mirror", intervalMs: p }),
    h = () => {
      document.visibilityState === "visible" && b();
    };
  n.whileOn(() => {
    let O = F.start(async () => {
      R();
    });
    return (
      window.addEventListener("focus", b),
      document.addEventListener("mousedown", b, !0),
      document.addEventListener("visibilitychange", h),
      b(),
      () => {
        (O.dispose(),
          window.removeEventListener("focus", b),
          document.removeEventListener("mousedown", b, !0),
          document.removeEventListener("visibilitychange", h));
      }
    );
  });
}
function pr({ getErrorMessage: e, getIpcRenderer: n, logWarn: t }, i) {
  let o = n();
  if (o == null || typeof document > "u" || !j()) return;
  let a = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]),
    s = (d) => {
      if (a.has(d.key))
        try {
          o.sendToHost(En, d.key);
        } catch (u) {
          t("vnc host key forward failed", e(u));
        }
    };
  i.whileOn(
    () => (
      document.addEventListener("keydown", s, !0),
      () => document.removeEventListener("keydown", s, !0)
    ),
  );
}
function fr({ getErrorMessage: e, getIpcRenderer: n, logWarn: t }) {
  let i = n();
  if (i == null) return;
  let o = i;
  if (
    typeof window > "u" ||
    typeof document > "u" ||
    typeof location > "u" ||
    !location.pathname.endsWith("/vnc.html")
  )
    return;
  function a(c, y) {
    try {
      o.sendToHost("sand:vnc-session", JSON.stringify({ phase: c, clean: y }));
    } catch (R) {
      t("vnc session report failed", e(R));
    }
  }
  let s = 0,
    d = !1,
    u = null;
  function p() {
    let c = document.documentElement.classList;
    return c.contains("noVNC_connected")
      ? "connected"
      : c.contains("noVNC_reconnecting")
        ? "reconnecting"
        : c.contains("noVNC_connecting")
          ? "connecting"
          : c.contains("noVNC_disconnecting")
            ? "disconnecting"
            : "disconnected";
  }
  function m() {
    let c = p();
    c !== u &&
      ((u = c),
      c === "connected"
        ? ((s += 1), a(s > 1 ? "reconnect" : "rfb_connect", !0), (d = !0))
        : d &&
          c !== "connecting" &&
          (a("rfb_disconnect", c === "disconnecting"), (d = !1)));
  }
  function f() {
    let c = new MutationObserver(m);
    (c.observe(document.documentElement, {
      attributes: !0,
      attributeFilter: ["class"],
    }),
      m(),
      window.addEventListener("pagehide", () => c.disconnect(), { once: !0 }));
  }
  document.documentElement == null
    ? document.addEventListener("DOMContentLoaded", () => f(), { once: !0 })
    : f();
}
function mr(
  { getErrorMessage: e, getIpcRenderer: n, getWebFrame: t, logWarn: i },
  o,
) {
  let a = t();
  if (a == null) return;
  let s = a;
  if (typeof document > "u" || !location.pathname.endsWith("/vnc.html")) return;
  function d(y) {
    s.executeJavaScript(y).catch((R) => {
      i("vnc frame hold failed", e(R));
    });
  }
  let u = !0,
    p = !1;
  function m() {
    let y = document.visibilityState === "hidden" || !u;
    y !== p && ((p = y), d(Cn(p)));
  }
  let f = o.isOn() ? Jn : Ce;
  function c(y) {
    y !== f && ((f = y), d(Mn(y)));
  }
  (d(wn(f)),
    o.whileOn(() => (c(Jn), () => c(Ce))),
    n()?.on(he, (y, R) => {
      typeof R == "boolean" && ((u = R), m());
    }),
    document.addEventListener("visibilitychange", m),
    m());
}
function yr(
  { getErrorMessage: e, getIpcRenderer: n, getWebFrame: t, logWarn: i },
  o,
) {
  let a = n(),
    s = t();
  if (a == null || s == null) return;
  let d = a,
    u = s;
  if (typeof window > "u" || typeof document > "u" || !j()) return;
  let p = Nn(),
    m = Ln(),
    f = $({ name: "vnc-liveness-sampler", intervalMs: 1e3 });
  o.whileOn(() => {
    (u.executeJavaScript(On()).catch((y) => {
      i("vnc liveness beacon install failed", e(y));
    }),
      p.reset());
    let c = f.start(async () => {
      if (
        document.documentElement?.classList.contains("noVNC_connected") !== !0
      ) {
        p.reset();
        return;
      }
      try {
        let y = await u.executeJavaScript(m),
          R = Dn(y);
        if (R == null) return;
        let b = p.sample(performance.now(), R);
        if (b == null) return;
        d.sendToHost(kn, b);
      } catch (y) {
        i("vnc liveness sample failed", e(y));
      }
    });
    return () => {
      (c.dispose(),
        u.executeJavaScript(Pn()).catch((y) => {
          i("vnc liveness beacon removal failed", e(y));
        }));
    };
  });
}
function gr({ getErrorMessage: e, getWebFrame: n, logWarn: t }, i) {
  let o = n();
  if (o == null) return;
  let a = o,
    s = `
    (function () {
      if (window.${X}) return;
      if (!/Mac/i.test((navigator && navigator.platform) || "")) return;

      var CHORDS = ${JSON.stringify(Ee)};
      var HELD_MODIFIERS = ${JSON.stringify(Re)};

      var ui = null;
      import("./app/ui.js")
        .then(function (m) { ui = m && m.default; })
        .catch(function () {});

      function sendChordAsControl(e) {
        if (!e.metaKey) return;
        var chord = CHORDS.find(function (entry) { return entry.code === e.code; });
        if (!chord) return;
        var rfb = ui && ui.rfb;
        if (!rfb || typeof rfb.sendKey !== "function") return;
        e.preventDefault();
        e.stopImmediatePropagation();
        // noVNC presses Meta/Alt down for Cmd, so release them first to avoid
        // sending Alt+Ctrl+key instead of a clean Ctrl+key.
        for (var i = 0; i < HELD_MODIFIERS.length; i++) {
          try { rfb.sendKey(HELD_MODIFIERS[i][0], HELD_MODIFIERS[i][1], false); } catch (_e) {}
        }
        var withShift = e.shiftKey || chord.forceShift;
        var chordKeysym = withShift ? chord.keysym - 0x20 : chord.keysym;
        rfb.sendKey(${re}, "ControlLeft", true);
        if (withShift) rfb.sendKey(${oe}, "ShiftLeft", true);
        rfb.sendKey(chordKeysym, e.code, true);
        rfb.sendKey(chordKeysym, e.code, false);
        if (withShift) rfb.sendKey(${oe}, "ShiftLeft", false);
        rfb.sendKey(${re}, "ControlLeft", false);
      }

      document.addEventListener("keydown", sendChordAsControl, true);
      window.${X} = {
        remove: function () {
          document.removeEventListener("keydown", sendChordAsControl, true);
          delete window.${X};
        },
      };
    })();
  `;
  i.whileOn(
    () => (
      a.executeJavaScript(s).catch((d) => {
        t("vnc mac key mapping injection failed", e(d));
      }),
      () => {
        a.executeJavaScript(`window.${X} && window.${X}.remove()`).catch(
          (d) => {
            t("vnc mac key mapping removal failed", e(d));
          },
        );
      }
    ),
  );
}
function Er({ getErrorMessage: e, getWebFrame: n, logWarn: t }, i) {
  let o = n();
  if (o == null || !j()) return;
  let a = o;
  i.whileOn(
    () => (
      a.executeJavaScript(Sn()).catch((s) => {
        t("vnc adaptive quality failed", e(s));
      }),
      () => {
        a.executeJavaScript(_n()).catch((s) => {
          t("vnc adaptive quality removal failed", e(s));
        });
      }
    ),
  );
}
function Rr({ getErrorMessage: e, getWebFrame: n, logWarn: t }, i) {
  let o = n();
  if (o == null) return;
  let a = o;
  i.whileOn(
    () => (
      a.executeJavaScript(An()).catch((s) => {
        t("vnc ime field injection failed", e(s));
      }),
      () => {
        a.executeJavaScript(In()).catch((s) => {
          t("vnc ime field removal failed", e(s));
        });
      }
    ),
  );
}
function Qn(e = we) {
  let {
    getErrorMessage: n,
    getIpcRenderer: t,
    installSandBrowserPreload: i,
    logWarn: o,
  } = e;
  i();
  let { interactivity: a, input: s } = lr(t());
  try {
    cr(e);
  } catch (d) {
    o("noVNC chrome hider install failed", n(d));
  }
  try {
    ur(e, s);
  } catch (d) {
    o("vnc clipboard bridge install failed", n(d));
  }
  try {
    pr(e, s);
  } catch (d) {
    o("vnc host key forwarder install failed", n(d));
  }
  try {
    fr(e);
  } catch (d) {
    o("vnc rfb session reporter install failed", n(d));
  }
  try {
    mr(e, a);
  } catch (d) {
    o("vnc frame hold install failed", n(d));
  }
  try {
    gr(e, s);
  } catch (d) {
    o("vnc mac key mapping install failed", n(d));
  }
  try {
    Rr(e, s);
  } catch (d) {
    o("vnc ime field install failed", n(d));
  }
  try {
    Er(e, a);
  } catch (d) {
    o("vnc adaptive quality install failed", n(d));
  }
  try {
    yr(e, s);
  } catch (d) {
    o("vnc liveness tripwire install failed", n(d));
  }
}
Qn();
0 && (module.exports = { installVncPreload });
//# debugId=f3560e3c-3d6e-42cd-925d-a01a5eb0fcc6
