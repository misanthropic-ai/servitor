            type: "text",
            text: I.message.content,
            ...NN ? {
                cache_control: {
                    type: "ephemeral"
                }
            } : {}
        } ]
    }; else return {
        role: "user",
        content: I.message.content.map((Z, d) => ({
            ...Z,
            ...d === I.message.content.length - 1 ? NN ? {
                cache_control: {
                    type: "ephemeral"
                }
            } : {} : {}
        }))
    };
    return {
        role: "user",
        content: I.message.content
    };
}

function Vg3(I, G = !1) {
    if (G) if (typeof I.message.content === "string") return {
        role: "assistant",
        content: [ {
            type: "text",
            text: I.message.content,
            ...NN ? {
                cache_control: {
                    type: "ephemeral"
                }
            } : {}
        } ]
    }; else return {
        role: "assistant",
        content: I.message.content.map((Z, d) => ({
            ...Z,
            ...d === I.message.content.length - 1 && Z.type !== "thinking" && Z.type !== "redacted_thinking" ? NN ? {
                cache_control: {
                    type: "ephemeral"
                }
            } : {} : {}
        }))
    };
    return {
        role: "assistant",
        content: I.message.content
    };
}

function f11(I) {
    let G = I[0] || "", Z = I.slice(1);
    return [ G, Z.join(`
`) ].filter(Boolean);
}

async function VT(I, G, Z, d, W, B) {
    return await Vq1(I, () => Cg3(I, G, Z, d, W, B));
}

function D$2(I, G) {
    if (Object.entries(G).length === 0) return I;
    return [ ...I, `
As you answer the user's questions, you can use the following context:
`, ...Object.entries(G).map(([ Z, d ]) => `<context name="${Z}">${d}</context>`) ];
}

async function Cg3(I, G, Z, d, W, B) {
    let w = await M11({
        maxRetries: 0,
        model: B.model
    });
    if (B.prependCLISysprompt) {
        let [ j ] = f11(G);
        B0("tengu_sysprompt_block", {
            snippet: j?.slice(0, 20),
            length: String(j?.length ?? 0),
            hash: j ? aq3("sha256").update(j).digest("hex") : ""
        }), G = [ w$2(), ...G ];
    }
    let V = f11(G).map(j => ({
        ...NN ? {
            cache_control: {
                type: "ephemeral"
            }
        } : {},
        text: j,
        type: "text"
    })), C = await Promise.all(d.map(async j => ({
        name: j.name,
        description: await j.prompt({
            permissionMode: B.permissionMode
        }),
        input_schema: "inputJSONSchema" in j && j.inputJSONSchema ? j.inputJSONSchema : BN(j.inputSchema)
    }))), X = await cx(), Y = NN && X.length > 0;
    B0("tengu_api_query", {
        model: B.model,
        messagesLength: String(JSON.stringify([ ...V, ...I, ...C ]).length),
        temperature: String(XU1),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
        ...Y ? {
            betas: X.join(",")
        } : {}
    });
    let A = Date.now(), D = Date.now(), J = 0, K, z = void 0;
    try {
        K = await E11(async j => {
            J = j, D = Date.now();
            let V1 = w.beta.messages.stream({
                model: B.model,
                max_tokens: Math.max(Z + 1, _g3(B.model)),
                messages: Xg3(I),
                temperature: XU1,
                system: V,
                tools: C,
                tool_choice: B.toolChoice,
                ...Y ? {
                    betas: X
                } : {},
                metadata: v11(),
                ...Z > 0 ? {
                    thinking: {
                        budget_tokens: Z,
                        type: "enabled"
                    }
                } : {}
            }, {
                signal: W
            });
            return z = V1, HU1(V1);
        });
    } catch (j) {
        return W0(j), B0("tengu_api_error", {
            model: B.model,
            error: j instanceof Error ? j.message : String(j),
            status: j instanceof w5 ? String(j.status) : void 0,
            messageCount: String(I.length),
            messageTokens: String(xA(I)),
            durationMs: String(Date.now() - D),
            durationMsIncludingRetries: String(Date.now() - A),
            attempt: String(J),
            provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
            requestId: z?.request_id ?? void 0
        }), DU1(j);
    }
    let Q = Date.now() - D, U = Date.now() - A;
    B0("tengu_api_success", {
        model: B.model,
        messageCount: String(I.length),
        messageTokens: String(xA(I)),
        inputTokens: String(K.usage.input_tokens),
        outputTokens: String(K.usage.output_tokens),
        cachedInputTokens: String(K.usage.cache_read_input_tokens ?? 0),
        uncachedInputTokens: String(K.usage.cache_creation_input_tokens ?? 0),
        durationMs: String(Q),
        durationMsIncludingRetries: String(U),
        attempt: String(J),
        ttftMs: String(K.ttftMs),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
        requestId: z?.request_id ?? void 0,
        stop_reason: K.stop_reason ?? void 0
    });
    let M = K.usage.input_tokens, S = K.usage.output_tokens, L = K.usage.cache_read_input_tokens ?? 0, P = K.usage.cache_creation_input_tokens ?? 0, m = M / 1e6 * oq3 + S / 1e6 * eq3 + L / 1e6 * Ig3 + P / 1e6 * tq3;
    return fS(m, U, Q), {
        message: {
            ...K,
            content: $11(K.content),
            usage: {
                ...K.usage,
                cache_read_input_tokens: K.usage.cache_read_input_tokens ?? 0,
                cache_creation_input_tokens: K.usage.cache_creation_input_tokens ?? 0
            }
        },
        costUSD: m,
        durationMs: Q,
        surface: "both",
        type: "assistant",
        uuid: YU1()
    };
}

function DU1(I) {
    if (I instanceof Error && I.message.includes("prompt is too long")) return LE({
        content: AU1,
        surface: "both"
    });
    if (I instanceof Error && I.message.includes("Your credit balance is too low")) return LE({
        content: _U1,
        surface: "both"
    });
    if (I instanceof Error && I.message.toLowerCase().includes("x-api-key")) return LE({
        content: R11,
        surface: "both"
    });
    if (I instanceof Error) return LE({
        content: `${qB}: ${I.message}`,
        surface: "both"
    });
    return LE({
        content: qB,
        surface: "both"
    });
}

function Xg3(I) {
    return I.map((G, Z) => {
        return G.type === "user" ? wg3(G, Z > I.length - 3) : Vg3(G, Z > I.length - 3);
    });
}

async function Yg3({
    systemPrompt: I,
    userPrompt: G,
    assistantPrompt: Z,
    signal: d
}) {
    let W = await M11({
        maxRetries: 0,
        model: Cw
    }), B = Cw, w = [ {
        role: "user",
        content: G
    }, ...Z ? [ {
        role: "assistant",
        content: Z
    } ] : [] ], V = f11(I).map(P => ({
        ...NN ? {
            cache_control: {
                type: "ephemeral"
            }
        } : {},
        text: P,
        type: "text"
    }));
    B0("tengu_api_query", {
        model: B,
        messagesLength: String(JSON.stringify([ ...V, ...w ]).length),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    });
    let C = 0, X = Date.now(), Y = Date.now(), A, D = void 0;
    try {
        A = await E11(async P => {
            C = P, X = Date.now();
            let m = W.beta.messages.stream({
                model: B,
                max_tokens: 512,
                messages: w,
                system: V,
                temperature: 0,
                metadata: v11(),
                stream: !0
            }, {
                signal: d
            });
            return D = m, await HU1(m);
        });
    } catch (P) {
        return W0(P), B0("tengu_api_error", {
            error: P instanceof Error ? P.message : String(P),
            status: P instanceof w5 ? String(P.status) : void 0,
            model: Cw,
            messageCount: String(Z ? 2 : 1),
            durationMs: String(Date.now() - X),
            durationMsIncludingRetries: String(Date.now() - Y),
            attempt: String(C),
            provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
            requestId: D?.request_id ?? void 0
        }), DU1(P);
    }
    let J = A.usage.input_tokens, K = A.usage.output_tokens, z = A.usage.cache_read_input_tokens ?? 0, Q = A.usage.cache_creation_input_tokens ?? 0, U = J / 1e6 * Y$2 + K / 1e6 * A$2 + z / 1e6 * sq3 + Q / 1e6 * rq3, M = Date.now() - X, S = Date.now() - Y;
    fS(U, S, M);
    let L = {
        durationMs: M,
        message: {
            ...A,
            content: $11(A.content)
        },
        costUSD: U,
        surface: "both",
        uuid: YU1(),
        type: "assistant"
    };
    return B0("tengu_api_success", {
        model: Cw,
        messageCount: String(Z ? 2 : 1),
        inputTokens: String(J),
        outputTokens: String(A.usage.output_tokens),
        cachedInputTokens: String(A.usage.cache_read_input_tokens ?? 0),
        uncachedInputTokens: String(A.usage.cache_creation_input_tokens ?? 0),
        durationMs: String(M),
        durationMsIncludingRetries: String(S),
        ttftMs: String(A.ttftMs),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
        requestId: D?.request_id ?? void 0,
        stop_reason: A.stop_reason ?? void 0
    }), L;
}

async function Ag3({
    systemPrompt: I,
    userPrompt: G,
    assistantPrompt: Z,
    signal: d
}) {
    let W = await M11({
        maxRetries: 0,
        model: Cw
    }), B = Cw, w = [ {
        role: "user",
        content: G
    }, ...Z ? [ {
        role: "assistant",
        content: Z
    } ] : [] ];
    B0("tengu_api_query", {
        model: B,
        messagesLength: String(JSON.stringify([ {
            systemPrompt: I
        }, ...w ]).length),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    });
    let V = 0, C = Date.now(), X = Date.now(), Y, A = void 0;
    try {
        Y = await E11(async M => {
            V = M, C = Date.now();
            let S = W.beta.messages.stream({
                model: B,
                max_tokens: 512,
                messages: w,
                system: f11(I).map(L => ({
                    type: "text",
                    text: L
                })),
                temperature: 0,
                metadata: v11(),
                stream: !0
            }, {
                signal: d
            });
            return A = S, await HU1(S);
        });
    } catch (M) {
        return W0(M), B0("tengu_api_error", {
            error: M instanceof Error ? M.message : String(M),
            status: M instanceof w5 ? String(M.status) : void 0,
            model: Cw,
            messageCount: String(Z ? 2 : 1),
            durationMs: String(Date.now() - C),
            durationMsIncludingRetries: String(Date.now() - X),
            attempt: String(V),
            provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
            requestId: A?.request_id ?? void 0
        }), DU1(M);
    }
    let D = Date.now() - C, J = Date.now() - X;
    B0("tengu_api_success", {
        model: Cw,
        messageCount: String(Z ? 2 : 1),
        inputTokens: String(Y.usage.input_tokens),
        outputTokens: String(Y.usage.output_tokens),
        durationMs: String(D),
        durationMsIncludingRetries: String(J),
        attempt: String(V),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p",
        requestId: A?.request_id ?? void 0,
        stop_reason: Y.stop_reason ?? void 0
    });
    let K = Y.usage.input_tokens, z = Y.usage.output_tokens, Q = K / 1e6 * Y$2 + z / 1e6 * A$2;
    return fS(Q, J, D), {
        durationMs: D,
        message: {
            ...Y,
            content: $11(Y.content),
            usage: {
                ...Y.usage,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0
            }
        },
        costUSD: Q,
        surface: "both",
        type: "assistant",
        uuid: YU1()
    };
}

async function oZ({
    systemPrompt: I = [],
    userPrompt: G,
    assistantPrompt: Z,
    enablePromptCaching: d = !1,
    signal: W
}) {
    return await Vq1([ h9({
        content: I.map(B => ({
            type: "text",
            text: B
        })),
        surface: "both"
    }), h9({
        content: G,
        surface: "both"
    }) ], () => {
        return d ? Yg3({
            systemPrompt: I,
            userPrompt: G,
            assistantPrompt: Z,
            signal: W
        }) : Ag3({
            systemPrompt: I,
            userPrompt: G,
            assistantPrompt: Z,
            signal: W
        });
    });
}

function _g3(I) {
    if (I.includes("3-5")) return 8192;
    if (I.includes("haiku")) return 8192;
    if (I.includes("opus")) return 4096;
    return 2e4;
}

import {
    existsSync as RU1,
    mkdirSync as mg3,
    readFileSync as $$2,
    statSync as S$2
} from "fs";

var m9 = A1(u1(), 1);

import {
    EOL as Tg3
} from "os";

import {
    dirname as bg3,
    extname as jg3,
    isAbsolute as vU1,
    relative as EU1,
    resolve as MU1,
    sep as lg3
} from "path";

var t3 = A1(u1(), 1);

function vB(I, G) {
    return I.flatMap((Z, d) => d ? [ G(d), Z ] : [ Z ]);
}

var YT = A1(u1(), 1);

var F6 = A1(u1(), 1);

var F$2 = A1(u1(), 1);

function J$2({
    patch: I,
    dim: G,
    width: Z,
    overrideTheme: d
}) {
    return F$2.useMemo(() => Hg3(I.lines, I.oldStart, Z, G, d), [ I.lines, I.oldStart, Z, G, d ]).map((B, w) => F6.createElement(p, {
        key: w
    }, B));
}

function Hg3(I, G, Z, d, W) {
    let B = e1(W), w = Dg3(I.map(X => {
        if (X.startsWith("+")) return {
            code: " " + X.slice(1),
            i: 0,
            type: "add"
        };
        if (X.startsWith("-")) return {
            code: " " + X.slice(1),
            i: 0,
            type: "remove"
        };
        return {
            code: X,
            i: 0,
            type: "nochange"
        };
    }), G), C = Math.max(...w.map(({
        i: X
    }) => X)).toString().length;
    return w.flatMap(({
        type: X,
        code: Y,
        i: A
    }) => {
        return Zt(Y, Z - C).map((J, K) => {
            let z = `${X}-${A}-${K}`;
            switch (X) {
              case "add":
                return F6.createElement(O, {
                    key: z
                }, F6.createElement(FU1, {
                    i: K === 0 ? A : void 0,
                    width: C
                }), F6.createElement(O, {
                    color: W ? B.text : void 0,
                    backgroundColor: d ? B.diff.addedDimmed : B.diff.added,
                    dimColor: d
                }, J));

              case "remove":
                return F6.createElement(O, {
                    key: z
                }, F6.createElement(FU1, {
                    i: K === 0 ? A : void 0,
                    width: C
                }), F6.createElement(O, {
                    color: W ? B.text : void 0,
                    backgroundColor: d ? B.diff.removedDimmed : B.diff.removed,
                    dimColor: d
                }, J));

              case "nochange":
                return F6.createElement(O, {
                    key: z
                }, F6.createElement(FU1, {
                    i: K === 0 ? A : void 0,
                    width: C
                }), F6.createElement(O, {
                    color: W ? B.text : void 0,
                    dimColor: d
                }, J));
            }
        });
    });
}

function FU1({
    i: I,
    width: G
}) {
    return F6.createElement(O, {
        color: e1().secondaryText
    }, I !== void 0 ? I.toString().padStart(G) : " ".repeat(G), " ");
}

function Dg3(I, G) {
    let Z = G, d = [], W = [ ...I ];
    while (W.length > 0) {
        let {
            code: B,
            type: w
        } = W.shift(), V = {
            code: B,
            type: w,
            i: Z
        };
        switch (w) {
          case "nochange":
            Z++, d.push(V);
            break;

          case "add":
            Z++, d.push(V);
            break;

          case "remove":
            {
                d.push(V);
                let C = 0;
                while (W[0]?.type === "remove") {
                    Z++;
                    let {
                        code: X,
                        type: Y
                    } = W.shift(), A = {
                        code: X,
                        type: Y,
                        i: Z
                    };
                    d.push(A), C++;
                }
                Z -= C;
                break;
            }
        }
    }
    return d;
}

var H4 = A1(u1(), 1);

function FV() {}

FV.prototype = {
    diff: function I(G, Z) {
        var d, W = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, B = W.callback;
        if (typeof W === "function") B = W, W = {};
        var w = this;
        function V(L) {
            if (L = w.postProcess(L, W), B) return setTimeout(function() {
                B(L);
            }, 0), !0; else return L;
        }
        G = this.castInput(G, W), Z = this.castInput(Z, W), G = this.removeEmpty(this.tokenize(G, W)), 
        Z = this.removeEmpty(this.tokenize(Z, W));
        var C = Z.length, X = G.length, Y = 1, A = C + X;
        if (W.maxEditLength != null) A = Math.min(A, W.maxEditLength);
        var D = (d = W.timeout) !== null && d !== void 0 ? d : 1 / 0, J = Date.now() + D, K = [ {
            oldPos: -1,
            lastComponent: void 0
        } ], z = this.extractCommon(K[0], Z, G, 0, W);
        if (K[0].oldPos + 1 >= X && z + 1 >= C) return V(K$2(w, K[0].lastComponent, Z, G, w.useLongestToken));
        var Q = -1 / 0, U = 1 / 0;
        function M() {
            for (var L = Math.max(Q, -Y); L <= Math.min(U, Y); L += 2) {
                var P = void 0, m = K[L - 1], j = K[L + 1];
                if (m) K[L - 1] = void 0;
                var V1 = !1;
                if (j) {
                    var k = j.oldPos - L;
                    V1 = j && 0 <= k && k < C;
                }
                var j1 = m && m.oldPos + 1 < X;
                if (!V1 && !j1) {
                    K[L] = void 0;
                    continue;
                }
                if (!j1 || V1 && m.oldPos < j.oldPos) P = w.addToPath(j, !0, !1, 0, W); else P = w.addToPath(m, !1, !0, 1, W);
                if (z = w.extractCommon(P, Z, G, L, W), P.oldPos + 1 >= X && z + 1 >= C) return V(K$2(w, P.lastComponent, Z, G, w.useLongestToken)); else {
                    if (K[L] = P, P.oldPos + 1 >= X) U = Math.min(U, L - 1);
                    if (z + 1 >= C) Q = Math.max(Q, L + 1);
                }
            }
            Y++;
        }
        if (B) (function L() {
            setTimeout(function() {
                if (Y > A || Date.now() > J) return B();
                if (!M()) L();
            }, 0);
        })(); else while (Y <= A && Date.now() <= J) {
            var S = M();
            if (S) return S;
        }
    },
    addToPath: function I(G, Z, d, W, B) {
        var w = G.lastComponent;
        if (w && !B.oneChangePerToken && w.added === Z && w.removed === d) return {
            oldPos: G.oldPos + W,
            lastComponent: {
                count: w.count + 1,
                added: Z,
                removed: d,
                previousComponent: w.previousComponent
            }
        }; else return {
            oldPos: G.oldPos + W,
            lastComponent: {
                count: 1,
                added: Z,
                removed: d,
                previousComponent: w
            }
        };
    },
    extractCommon: function I(G, Z, d, W, B) {
        var w = Z.length, V = d.length, C = G.oldPos, X = C - W, Y = 0;
        while (X + 1 < w && C + 1 < V && this.equals(d[C + 1], Z[X + 1], B)) if (X++, 
        C++, Y++, B.oneChangePerToken) G.lastComponent = {
            count: 1,
            previousComponent: G.lastComponent,
            added: !1,
            removed: !1
        };
        if (Y && !B.oneChangePerToken) G.lastComponent = {
            count: Y,
            previousComponent: G.lastComponent,
            added: !1,
            removed: !1
        };
        return G.oldPos = C, X;
    },
    equals: function I(G, Z, d) {
        if (d.comparator) return d.comparator(G, Z); else return G === Z || d.ignoreCase && G.toLowerCase() === Z.toLowerCase();
    },
    removeEmpty: function I(G) {
        var Z = [];
        for (var d = 0; d < G.length; d++) if (G[d]) Z.push(G[d]);
        return Z;
    },
    castInput: function I(G) {
        return G;
    },
    tokenize: function I(G) {
        return Array.from(G);
    },
    join: function I(G) {
        return G.join("");
    },
    postProcess: function I(G) {
        return G;
    }
};

function K$2(I, G, Z, d, W) {
    var B = [], w;
    while (G) B.push(G), w = G.previousComponent, delete G.previousComponent, G = w;
    B.reverse();
    var V = 0, C = B.length, X = 0, Y = 0;
    for (;V < C; V++) {
        var A = B[V];
        if (!A.removed) {
            if (!A.added && W) {
                var D = Z.slice(X, X + A.count);
                D = D.map(function(J, K) {
                    var z = d[Y + K];
                    return z.length > J.length ? z : J;
                }), A.value = I.join(D);
            } else A.value = I.join(Z.slice(X, X + A.count));
            if (X += A.count, !A.added) Y += A.count;
        } else A.value = I.join(d.slice(Y, Y + A.count)), Y += A.count;
    }
    return B;
}

var ur5 = new FV();

function z$2(I, G) {
    var Z;
    for (Z = 0; Z < I.length && Z < G.length; Z++) if (I[Z] != G[Z]) return I.slice(0, Z);
    return I.slice(0, Z);
}

function Q$2(I, G) {
    var Z;
    if (!I || !G || I[I.length - 1] != G[G.length - 1]) return "";
    for (Z = 0; Z < I.length && Z < G.length; Z++) if (I[I.length - (Z + 1)] != G[G.length - (Z + 1)]) return I.slice(-Z);
    return I.slice(-Z);
}

function KU1(I, G, Z) {
    if (I.slice(0, G.length) != G) throw Error("string ".concat(JSON.stringify(I), " doesn't start with prefix ").concat(JSON.stringify(G), "; this is a bug"));
    return Z + I.slice(G.length);
}

function zU1(I, G, Z) {
    if (!G) return I + Z;
    if (I.slice(-G.length) != G) throw Error("string ".concat(JSON.stringify(I), " doesn't end with suffix ").concat(JSON.stringify(G), "; this is a bug"));
    return I.slice(0, -G.length) + Z;
}

function CT(I, G) {
    return KU1(I, G, "");
}

function S11(I, G) {
    return zU1(I, G, "");
}

function N$2(I, G) {
    return G.slice(0, Fg3(I, G));
}

function Fg3(I, G) {
    var Z = 0;
    if (I.length > G.length) Z = I.length - G.length;
    var d = G.length;
    if (I.length < G.length) d = I.length;
    var W = Array(d), B = 0;
    W[0] = 0;
    for (var w = 1; w < d; w++) {
        if (G[w] == G[B]) W[w] = W[B]; else W[w] = B;
        while (B > 0 && G[w] != G[B]) B = W[B];
        if (G[w] == G[B]) B++;
    }
    B = 0;
    for (var V = Z; V < I.length; V++) {
        while (B > 0 && I[V] != G[B]) B = W[B];
        if (I[V] == G[B]) B++;
    }
    return B;
}

var L11 = "a-zA-Z0-9_\\u{C0}-\\u{FF}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}", Jg3 = new RegExp("[".concat(L11, "]+|\\s+|[^").concat(L11, "]"), "ug"), P11 = new FV();

P11.equals = function(I, G, Z) {
    if (Z.ignoreCase) I = I.toLowerCase(), G = G.toLowerCase();
    return I.trim() === G.trim();
};

P11.tokenize = function(I) {
    var G = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, Z;
    if (G.intlSegmenter) {
        if (G.intlSegmenter.resolvedOptions().granularity != "word") throw new Error('The segmenter passed must have a granularity of "word"');
        Z = Array.from(G.intlSegmenter.segment(I), function(B) {
            return B.segment;
        });
    } else Z = I.match(Jg3) || [];
    var d = [], W = null;
    return Z.forEach(function(B) {
        if (/\s/.test(B)) if (W == null) d.push(B); else d.push(d.pop() + B); else if (/\s/.test(W)) if (d[d.length - 1] == W) d.push(d.pop() + B); else d.push(W + B); else d.push(B);
        W = B;
    }), d;
};

P11.join = function(I) {
    return I.map(function(G, Z) {
        if (Z == 0) return G; else return G.replace(/^\s+/, "");
    }).join("");
};

P11.postProcess = function(I, G) {
    if (!I || G.oneChangePerToken) return I;
    var Z = null, d = null, W = null;
    if (I.forEach(function(B) {
        if (B.added) d = B; else if (B.removed) W = B; else {
            if (d || W) q$2(Z, W, d, B);
            Z = B, d = null, W = null;
        }
    }), d || W) q$2(Z, W, d, null);
    return I;
};

function q$2(I, G, Z, d) {
    if (G && Z) {
        var W = G.value.match(/^\s*/)[0], B = G.value.match(/\s*$/)[0], w = Z.value.match(/^\s*/)[0], V = Z.value.match(/\s*$/)[0];
        if (I) {
            var C = z$2(W, w);
            I.value = zU1(I.value, w, C), G.value = CT(G.value, C), Z.value = CT(Z.value, C);
        }
        if (d) {
            var X = Q$2(B, V);
            d.value = KU1(d.value, V, X), G.value = S11(G.value, X), Z.value = S11(Z.value, X);
        }
    } else if (Z) {
        if (I) Z.value = Z.value.replace(/^\s*/, "");
        if (d) d.value = d.value.replace(/^\s*/, "");
    } else if (I && d) {
        var Y = d.value.match(/^\s*/)[0], A = G.value.match(/^\s*/)[0], D = G.value.match(/\s*$/)[0], J = z$2(Y, A);
        G.value = CT(G.value, J);
        var K = Q$2(CT(Y, J), D);
        G.value = S11(G.value, K), d.value = KU1(d.value, Y, K), I.value = zU1(I.value, Y, Y.slice(0, Y.length - K.length));
    } else if (d) {
        var z = d.value.match(/^\s*/)[0], Q = G.value.match(/\s*$/)[0], U = N$2(Q, z);
        G.value = S11(G.value, U);
    } else if (I) {
        var M = I.value.match(/\s*$/)[0], S = G.value.match(/^\s*/)[0], L = N$2(M, S);
        G.value = CT(G.value, L);
    }
}

var f$2 = new FV();

f$2.tokenize = function(I) {
    var G = new RegExp("(\\r?\\n)|[".concat(L11, "]+|[^\\S\\n\\r]+|[^").concat(L11, "]"), "ug");
    return I.match(G) || [];
};

function R$2(I, G, Z) {
    return f$2.diff(I, G, Z);
}

var u11 = new FV();

u11.tokenize = function(I, G) {
    if (G.stripTrailingCr) I = I.replace(/\r\n/g, `
`);
    var Z = [], d = I.split(/(\n|\r\n)/);
    if (!d[d.length - 1]) d.pop();
    for (var W = 0; W < d.length; W++) {
        var B = d[W];
        if (W % 2 && !G.newlineIsToken) Z[Z.length - 1] += B; else Z.push(B);
    }
    return Z;
};

u11.equals = function(I, G, Z) {
    if (Z.ignoreWhitespace) {
        if (!Z.newlineIsToken || !I.includes(`
`)) I = I.trim();
        if (!Z.newlineIsToken || !G.includes(`
`)) G = G.trim();
    } else if (Z.ignoreNewlineAtEof && !Z.newlineIsToken) {
        if (I.endsWith(`
`)) I = I.slice(0, -1);
        if (G.endsWith(`
`)) G = G.slice(0, -1);
    }
    return FV.prototype.equals.call(this, I, G, Z);
};

function QU1(I, G, Z) {
    return u11.diff(I, G, Z);
}

var Kg3 = new FV();

Kg3.tokenize = function(I) {
    return I.split(/(\S.+?[.!?])(?=\s+|$)/);
};

var zg3 = new FV();

zg3.tokenize = function(I) {
    return I.split(/([{}:;,]|\s+)/);
};

function g$2(I, G) {
    var Z = Object.keys(I);
    if (Object.getOwnPropertySymbols) {
        var d = Object.getOwnPropertySymbols(I);
        G && (d = d.filter(function(W) {
            return Object.getOwnPropertyDescriptor(I, W).enumerable;
        })), Z.push.apply(Z, d);
    }
    return Z;
}

function U$2(I) {
    for (var G = 1; G < arguments.length; G++) {
        var Z = arguments[G] != null ? arguments[G] : {};
        G % 2 ? g$2(Object(Z), !0).forEach(function(d) {
            qg3(I, d, Z[d]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(I, Object.getOwnPropertyDescriptors(Z)) : g$2(Object(Z)).forEach(function(d) {
            Object.defineProperty(I, d, Object.getOwnPropertyDescriptor(Z, d));
        });
    }
    return I;
}

function Qg3(I, G) {
    if (typeof I != "object" || !I) return I;
    var Z = I[Symbol.toPrimitive];
    if (Z !== void 0) {
        var d = Z.call(I, G || "default");
        if (typeof d != "object") return d;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (G === "string" ? String : Number)(I);
}

function Ng3(I) {
    var G = Qg3(I, "string");
    return typeof G == "symbol" ? G : G + "";
}

function NU1(I) {
    return NU1 = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(G) {
        return typeof G;
    } : function(G) {
        return G && typeof Symbol == "function" && G.constructor === Symbol && G !== Symbol.prototype ? "symbol" : typeof G;
    }, NU1(I);
}

function qg3(I, G, Z) {
    if (G = Ng3(G), G in I) Object.defineProperty(I, G, {
        value: Z,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }); else I[G] = Z;
    return I;
}

function JU1(I) {
    return gg3(I) || Ug3(I) || fg3(I) || Rg3();
}

function gg3(I) {
    if (Array.isArray(I)) return qU1(I);
}

function Ug3(I) {
    if (typeof Symbol !== "undefined" && I[Symbol.iterator] != null || I["@@iterator"] != null) return Array.from(I);
}

function fg3(I, G) {
    if (!I) return;
    if (typeof I === "string") return qU1(I, G);
    var Z = Object.prototype.toString.call(I).slice(8, -1);
    if (Z === "Object" && I.constructor) Z = I.constructor.name;
    if (Z === "Map" || Z === "Set") return Array.from(I);
    if (Z === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(Z)) return qU1(I, G);
}

function qU1(I, G) {
    if (G == null || G > I.length) G = I.length;
    for (var Z = 0, d = new Array(G); Z < G; Z++) d[Z] = I[Z];
    return d;
}

function Rg3() {
    throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}

var XT = new FV();

XT.useLongestToken = !0;

XT.tokenize = u11.tokenize;

XT.castInput = function(I, G) {
    var {
        undefinedReplacement: Z,
        stringifyReplacer: d
    } = G, W = d === void 0 ? function(B, w) {
        return typeof w === "undefined" ? Z : w;
    } : d;
    return typeof I === "string" ? I : JSON.stringify(gU1(I, null, null, W), W, "  ");
};

XT.equals = function(I, G, Z) {
    return FV.prototype.equals.call(XT, I.replace(/,([\r\n])/g, "$1"), G.replace(/,([\r\n])/g, "$1"), Z);
};

function gU1(I, G, Z, d, W) {
    if (G = G || [], Z = Z || [], d) I = d(W, I);
    var B;
    for (B = 0; B < G.length; B += 1) if (G[B] === I) return Z[B];
    var w;
    if (Object.prototype.toString.call(I) === "[object Array]") {
        G.push(I), w = new Array(I.length), Z.push(w);
        for (B = 0; B < I.length; B += 1) w[B] = gU1(I[B], G, Z, d, W);
        return G.pop(), Z.pop(), w;
    }
    if (I && I.toJSON) I = I.toJSON();
    if (NU1(I) === "object" && I !== null) {
        G.push(I), w = {}, Z.push(w);
        var V = [], C;
        for (C in I) if (Object.prototype.hasOwnProperty.call(I, C)) V.push(C);
        V.sort();
        for (B = 0; B < V.length; B += 1) C = V[B], w[C] = gU1(I[C], G, Z, d, C);
        G.pop(), Z.pop();
    } else w = I;
    return w;
}

var UU1 = new FV();

UU1.tokenize = function(I) {
    return I.slice();
};

UU1.join = UU1.removeEmpty = function(I) {
    return I;
};

function v$2(I, G, Z, d, W, B, w) {
    if (!w) w = {};
    if (typeof w === "function") w = {
        callback: w
    };
    if (typeof w.context === "undefined") w.context = 4;
    if (w.newlineIsToken) throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
    if (!w.callback) return X(QU1(Z, d, w)); else {
        var V = w, C = V.callback;
        QU1(Z, d, U$2(U$2({}, w), {}, {
            callback: function Y(A) {
                var D = X(A);
                C(D);
            }
        }));
    }
    function X(Y) {
        if (!Y) return;
        Y.push({
            value: "",
            lines: []
        });
        function A(V1) {
            return V1.map(function(k) {
                return " " + k;
            });
        }
        var D = [], J = 0, K = 0, z = [], Q = 1, U = 1, M = function V1() {
            var k = Y[S], j1 = k.lines || vg3(k.value);
            if (k.lines = j1, k.added || k.removed) {
                var H1;
                if (!J) {
                    var $1 = Y[S - 1];
                    if (J = Q, K = U, $1) z = w.context > 0 ? A($1.lines.slice(-w.context)) : [], 
                    J -= z.length, K -= z.length;
                }
                if ((H1 = z).push.apply(H1, JU1(j1.map(function(l1) {
                    return (k.added ? "+" : "-") + l1;
                }))), k.added) U += j1.length; else Q += j1.length;
            } else {
                if (J) if (j1.length <= w.context * 2 && S < Y.length - 2) {
                    var F1;
                    (F1 = z).push.apply(F1, JU1(A(j1)));
                } else {
                    var u, I1 = Math.min(j1.length, w.context);
                    (u = z).push.apply(u, JU1(A(j1.slice(0, I1))));
                    var m1 = {
                        oldStart: J,
                        oldLines: Q - J + I1,
                        newStart: K,
                        newLines: U - K + I1,
                        lines: z
                    };
                    D.push(m1), J = 0, K = 0, z = [];
                }
                Q += j1.length, U += j1.length;
            }
        };
        for (var S = 0; S < Y.length; S++) M();
        for (var L = 0, P = D; L < P.length; L++) {
            var m = P[L];
            for (var j = 0; j < m.lines.length; j++) if (m.lines[j].endsWith(`
`)) m.lines[j] = m.lines[j].slice(0, -1); else m.lines.splice(j + 1, 0, "\\ No newline at end of file"), 
            j++;
        }
        return {
            oldFileName: I,
            newFileName: G,
            oldHeader: W,
            newHeader: B,
            hunks: D
        };
    }
}

function vg3(I) {
    var G = I.endsWith(`
`), Z = I.split(`
`).map(function(d) {
        return d + `
`;
    });
    if (G) Z.pop(); else Z.push(Z.pop().slice(0, -1));
    return Z;
}

var E$2 = A1(u1(), 1);

var Eg3 = .4;

function fU1({
    patch: I,
    dim: G,
    width: Z,
    overrideTheme: d
}) {
    return E$2.useMemo(() => Pg3(I.lines, I.oldStart, Z, G, d), [ I.lines, I.oldStart, Z, G, d ]).map((B, w) => H4.createElement(p, {
        key: w
    }, B));
}

function Mg3(I) {
    return I.map(G => {
        if (G.startsWith("+")) return {
            code: " " + G.slice(1),
            i: 0,
            type: "add",
            originalCode: G.slice(1)
        };
        if (G.startsWith("-")) return {
            code: " " + G.slice(1),
            i: 0,
            type: "remove",
            originalCode: G.slice(1)
        };
        return {
            code: G,
            i: 0,
            type: "nochange",
            originalCode: G
        };
    });
}

function $g3(I) {
    let G = [], Z = 0;
    while (Z < I.length) {
        let d = I[Z];
        if (!d) {
            Z++;
            continue;
        }
        if (d.type === "remove") {
            let W = [ d ], B = Z + 1;
            while (B < I.length && I[B]?.type === "remove") {
                let V = I[B];
                if (V) W.push(V);
                B++;
            }
            let w = [];
            while (B < I.length && I[B]?.type === "add") {
                let V = I[B];
                if (V) w.push(V);
                B++;
            }
            if (W.length > 0 && w.length > 0) {
                let V = Math.min(W.length, w.length);
                for (let C = 0; C < V; C++) {
                    let X = W[C], Y = w[C];
                    if (X && Y) X.wordDiff = !0, Y.wordDiff = !0, X.matchedLine = Y, 
                    Y.matchedLine = X;
                }
                G.push(...W.filter(Boolean)), G.push(...w.filter(Boolean)), Z = B;
            } else G.push(d), Z++;
        } else G.push(d), Z++;
    }
    return G;
}

function Sg3(I, G) {
    return R$2(I, G, {
        ignoreCase: !1
    });
}

function Lg3(I, G, Z, d, W) {
    let B = e1(W), {
        type: w,
        i: V,
        wordDiff: C,
        matchedLine: X,
        originalCode: Y
    } = I, A = `${w}-${V}-${G}`;
    if (!C || !X || G !== 0) return null;
    let D = Y, J = X.originalCode, K, z;
    if (w === "remove") K = D, z = J; else K = X.originalCode, z = Y;
    let Q = Sg3(K, z), U = K.length + z.length, L = Q.filter(P => P.added || P.removed).reduce((P, m) => P + m.value.length, 0) / U > Eg3 || d;
    if (w === "add") return H4.createElement(O, {
        key: A
    }, H4.createElement(PE, {
        i: V,
        width: Z
    }), H4.createElement(O, {
        backgroundColor: d ? B.diff.addedDimmed : B.diff.added
    }, " ", L ? H4.createElement(O, {
        color: W ? B.text : void 0,
        dimColor: d
    }, Y) : Q.map((P, m) => {
        if (P.added) return H4.createElement(O, {
            key: `part-${m}`,
            backgroundColor: d ? B.diff.addedWordDimmed : B.diff.addedWord,
            color: W ? B.text : void 0,
            dimColor: d
        }, P.value); else if (P.removed) return null; else return H4.createElement(O, {
            key: `part-${m}`,
            color: W ? B.text : void 0,
            dimColor: d
        }, P.value);
    }))); else if (w === "remove") return H4.createElement(O, {
        key: A
    }, H4.createElement(PE, {
        i: V,
        width: Z
    }), H4.createElement(O, {
        backgroundColor: d ? B.diff.removedDimmed : B.diff.removed
    }, " ", L ? H4.createElement(O, {
        color: W ? B.text : void 0,
        dimColor: d
    }, Y) : Q.map((P, m) => {
        if (P.removed) return H4.createElement(O, {
            key: `part-${m}`,
            backgroundColor: d ? B.diff.removedWordDimmed : B.diff.removedWord,
            color: W ? B.text : void 0,
            dimColor: d
        }, P.value); else if (P.added) return null; else return H4.createElement(O, {
            key: `part-${m}`,
            color: W ? B.text : void 0,
            dimColor: d
        }, P.value);
    })));
    return null;
}

function Pg3(I, G, Z, d, W) {
    let B = e1(W), w = Mg3(I), V = $g3(w), C = ug3(V, G), Y = Math.max(...C.map(({
        i: D
    }) => D), 0).toString().length, A = (D, J) => H4.createElement(O, {
        color: W ? B.text : void 0,
        backgroundColor: J,
        dimColor: d
    }, D);
    return C.flatMap(D => {
        let {
            type: J,
            code: K,
            i: z,
            wordDiff: Q,
            matchedLine: U
        } = D;
        return Zt(K, Z - Y).map((S, L) => {
            let P = `${J}-${z}-${L}`;
            if (Q && U && L === 0) {
                let m = Lg3(D, L, Y, d, W);
                if (m) return m;
                return H4.createElement(O, {
                    key: P
                }, H4.createElement(PE, {
                    i: L === 0 ? z : void 0,
                    width: Y
                }), A(S, void 0));
            } else switch (J) {
              case "add":
                return H4.createElement(O, {
                    key: P
                }, H4.createElement(PE, {
                    i: L === 0 ? z : void 0,
                    width: Y
                }), H4.createElement(O, {
                    color: W ? B.text : void 0,
                    backgroundColor: d ? B.diff.addedDimmed : B.diff.added,
                    dimColor: d
                }, S));

              case "remove":
                return H4.createElement(O, {
                    key: P
                }, H4.createElement(PE, {
                    i: L === 0 ? z : void 0,
                    width: Y
                }), H4.createElement(O, {
                    color: W ? B.text : void 0,
                    backgroundColor: d ? B.diff.removedDimmed : B.diff.removed,
                    dimColor: d
                }, S));

              case "nochange":
                return H4.createElement(O, {
                    key: P
                }, H4.createElement(PE, {
                    i: L === 0 ? z : void 0,
                    width: Y
                }), H4.createElement(O, {
                    color: W ? B.text : void 0,
                    dimColor: d
                }, S));
            }
        });
    });
}

function PE({
    i: I,
    width: G
}) {
    return H4.createElement(O, {
        color: e1().secondaryText
    }, I !== void 0 ? I.toString().padStart(G) : " ".repeat(G), " ");
}

function ug3(I, G) {
    let Z = G, d = [], W = [ ...I ];
    while (W.length > 0) {
        let B = W.shift(), {
            code: w,
            type: V,
            originalCode: C,
            wordDiff: X,
            matchedLine: Y
        } = B, A = {
            code: w,
            type: V,
            i: Z,
            originalCode: C,
            wordDiff: X,
            matchedLine: Y
        };
        switch (V) {
          case "nochange":
            Z++, d.push(A);
            break;

          case "add":
            Z++, d.push(A);
            break;

          case "remove":
            {
                d.push(A);
                let D = 0;
                while (W[0]?.type === "remove") {
                    Z++;
                    let J = W.shift(), {
                        code: K,
                        type: z,
                        originalCode: Q,
                        wordDiff: U,
                        matchedLine: M
                    } = J, S = {
                        code: K,
                        type: z,
                        i: Z,
                        originalCode: Q,
                        wordDiff: U,
                        matchedLine: M
                    };
                    d.push(S), D++;
                }
                Z -= D;
                break;
            }
        }
    }
    return d;
}

function EB(I) {
    if (np1("tengu_word_level_diff", !1)) return YT.createElement(fU1, {
        ...I
    }); else return YT.createElement(J$2, {
        ...I
    });
}

import {
    relative as yg3
} from "path";

var y11 = A1(u1(), 1);

function Q5() {
    let [ I, G ] = y11.useState({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24
    });
    return y11.useEffect(() => {
        function Z() {
            G({
                columns: process.stdout.columns || 80,
                rows: process.stdout.rows || 24
            });
        }
        return process.stdout.on("resize", Z), () => {
            process.stdout.off("resize", Z);
        };
    }, []), I;
}

function O11({
    filePath: I,
    structuredPatch: G,
    verbose: Z
}) {
    let {
        columns: d
    } = Q5(), W = G.reduce((w, V) => w + V.lines.filter(C => C.startsWith("+")).length, 0), B = G.reduce((w, V) => w + V.lines.filter(C => C.startsWith("-")).length, 0);
    return t3.createElement(p, {
        flexDirection: "column"
    }, t3.createElement(O, null, "  ", "⎿ Updated", " ", t3.createElement(O, {
        bold: !0
    }, Z ? I : yg3(u0(), I)), W > 0 || B > 0 ? " with " : "", W > 0 ? t3.createElement(t3.Fragment, null, t3.createElement(O, {
        bold: !0
    }, W), " ", W > 1 ? "additions" : "addition") : null, W > 0 && B > 0 ? " and " : null, B > 0 ? t3.createElement(t3.Fragment, null, t3.createElement(O, {
        bold: !0
    }, B), " ", B > 1 ? "removals" : "removal") : null), vB(G.map(w => t3.createElement(p, {
        flexDirection: "column",
        paddingLeft: 5,
        key: w.newStart
    }, t3.createElement(EB, {
        patch: w,
        dim: !1,
        width: d - 12
    }))), w => t3.createElement(p, {
        paddingLeft: 5,
        key: `ellipsis-${w}`
    }, t3.createElement(O, {
        color: e1().secondaryText
    }, "..."))));
}

var M$2 = `Write a file to the local filesystem. Overwrites the existing file if there is one.

Before using this tool:

1. Use the ReadFile tool to understand the file's contents and context

2. Directory Verification (only applicable when creating new files):
   - Use the LS tool to verify the parent directory exists and is the correct location`;

var Og3 = 3, AT = "<<:AMPERSAND_TOKEN:>>", _T = "<<:DOLLAR_TOKEN:>>";

function HT(I, G) {
    if (I.length === 0 && G) {
        let W = G.split(/\r?\n/).length;
        rx(W, 0);
        return;
    }
    let Z = I.reduce((W, B) => W + B.lines.filter(w => w.startsWith("+")).length, 0), d = I.reduce((W, B) => W + B.lines.filter(w => w.startsWith("-")).length, 0);
    rx(Z, d);
}

function G_({
    filePath: I,
    fileContents: G,
    oldStr: Z,
    newStr: d
}) {
    return v$2(I, I, G.replaceAll("&", AT).replaceAll("$", _T), G.replaceAll("&", AT).replaceAll("$", _T).replace(Z.replaceAll("&", AT).replaceAll("$", _T), d.replaceAll("&", AT).replaceAll("$", _T)), void 0, void 0, {
        context: Og3
    }).hunks.map(W => ({
        ...W,
        lines: W.lines.map(B => B.replaceAll(AT, "&").replaceAll(_T, "$"))
    }));
}

var $U1 = 10, L$2 = 16e3, kg3 = "<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with Grep in order to find the line numbers of what you are looking for.</NOTE>", xg3 = e.strictObject({
    file_path: e.string().describe("The absolute path to the file to write (must be absolute, not relative)"),
    content: e.string().describe("The content to write to the file")
}), y7 = {
    name: "Replace",
    async description() {
        return "Write a file to the local filesystem.";
    },
    userFacingName: () => "Write",
    async prompt() {
        return M$2;
    },
    async isEnabled() {
        return !0;
    },
    renderToolUseMessage(I, {
        verbose: G
    }) {
        return `file_path: ${G ? I.file_path : EU1(u0(), I.file_path)}`;
    },
    inputSchema: xg3,
    isReadOnly() {
        return !1;
    },
    getPath(I) {
        return I.file_path;
    },
    needsPermissions(I, {
        writeFileAllowedDirectories: G
    }) {
        return !QE(y7.getPath(I), G);
    },
    renderToolUseRejectedMessage({
        file_path: I,
        content: G
    }, {
        columns: Z,
        verbose: d
    }) {
        try {
            let W = vU1(I) ? I : MU1(u0(), I), B = RU1(W), w = B ? pG(W) : "utf-8", V = B ? $$2(W, w) : null, C = V ? "update" : "create", X = G_({
                filePath: I,
                fileContents: V ?? "",
                oldStr: V ?? "",
                newStr: G
            });
            return m9.createElement(p, {
                flexDirection: "column"
            }, m9.createElement(O, null, "  ", "⎿", " ", m9.createElement(O, {
                color: e1().error
            }, "User rejected ", C === "update" ? "update" : "write", " to", " "), m9.createElement(O, {
                bold: !0
            }, d ? I : EU1(u0(), I))), vB(X.map(Y => m9.createElement(p, {
                flexDirection: "column",
                paddingLeft: 5,
                key: Y.newStart
            }, m9.createElement(EB, {
                patch: Y,
                dim: !0,
                width: Z - 12
            }))), Y => m9.createElement(p, {
                paddingLeft: 5,
                key: `ellipsis-${Y}`
            }, m9.createElement(O, {
                color: e1().secondaryText
            }, "..."))));
        } catch (W) {
            return W0(W), m9.createElement(p, {
                flexDirection: "column"
            }, m9.createElement(O, null, "  ", "⎿ (No changes)"));
        }
    },
    renderToolResultMessage({
        filePath: I,
        content: G,
        structuredPatch: Z,
        type: d
    }, {
        verbose: W
    }) {
        switch (d) {
          case "create":
            {
                let B = G || "(No content)", w = G.split(Tg3).length;
                return m9.createElement(p, {
                    flexDirection: "column"
                }, m9.createElement(O, null, "  ", "⎿ Wrote ", w, " lines to", " ", m9.createElement(O, {
                    bold: !0
                }, W ? I : EU1(u0(), I))), m9.createElement(p, {
                    flexDirection: "column",
                    paddingLeft: 5
                }, m9.createElement(SX, {
                    code: W ? B : B.split(`
`).slice(0, $U1).filter(V => V.trim() !== "").join(`
`),
                    language: jg3(I).slice(1)
                }), !W && w > $U1 && m9.createElement(O, {
                    color: e1().secondaryText
                }, "... (+", w - $U1, " lines)")));
            }

          case "update":
            return m9.createElement(O11, {
                filePath: I,
                structuredPatch: Z,
                verbose: W
            });
        }
    },
    async validateInput({
        file_path: I
    }, {
        readFileTimestamps: G
    }) {
        let Z = vU1(I) ? I : MU1(u0(), I);
        if (gD(Z)) return {
            result: !1,
            message: "File is in a directory that is ignored by your project configuration."
        };
        if (!RU1(Z)) return {
            result: !0
        };
        let d = G[Z];
        if (!d) return {
            result: !1,
            message: "File has not been read yet. Read it first before writing to it."
        };
        if (S$2(Z).mtimeMs > d) return {
            result: !1,
            message: "File has been modified since read, either by the user or by a linter. Read it again before attempting to write it."
        };
        return {
            result: !0
        };
    },
    async *call({
        file_path: I,
        content: G
    }, {
        readFileTimestamps: Z
    }) {
        let d = vU1(I) ? I : MU1(u0(), I), W = bg3(d), B = RU1(d), w = B ? pG(d) : "utf-8", V = B ? $$2(d, w) : null, C = B ? nz(d) : await ld0(u0());
        if (mg3(W, {
            recursive: !0
        }), eY(d, G, w, C), Z[d] = S$2(d).mtimeMs, d.endsWith(`${lg3}CLAUDE.md`)) B0("tengu_write_claudemd", {});
        if (V) {
            let Y = G_({
                filePath: I,
                fileContents: V,
                oldStr: V,
                newStr: G
            }), A = {
                type: "update",
                filePath: I,
                content: G,
                structuredPatch: Y
            };
            HT(Y), yield {
                type: "result",
                data: A,
                resultForAssistant: this.renderResultForAssistant(A)
            };
            return;
        }
        let X = {
            type: "create",
            filePath: I,
            content: G,
            structuredPatch: []
        };
        HT([], G), yield {
            type: "result",
            data: X,
            resultForAssistant: this.renderResultForAssistant(X)
        };
    },
    renderResultForAssistant({
        filePath: I,
        content: G,
        type: Z
    }) {
        switch (Z) {
          case "create":
            return `File created successfully at: ${I}`;

          case "update":
            return `The file ${I} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:
${af({
                content: G.split(/\r?\n/).length > L$2 ? G.split(/\r?\n/).slice(0, L$2).join(`
`) + kg3 : G,
                startLine: 1
            })}`;
        }
    }
};

function P$2(I) {
    switch (I) {
      case "default":
        return null;

      case "dangerouslySkipPermissions":
        return "Bypassing Permissions";
    }
}

function u$2(I) {
    return I.message.content.map(G => {
        if (G.type === "text") return "text";
        if (G.type === "tool_use") return G.name;
        return G.type;
    });
}

async function y$2(I, G, Z, d) {
    B0("tengu_binary_feedback_display_decision", {
        decision: I.toString(),
        reason: d,
        msg_id_A: G.message.id,
        msg_id_B: Z.message.id,
        seqA: String(u$2(G)),
        seqB: String(u$2(Z))
    });
}

function hg3(I, G) {
    return I.text === G.text;
}

function cg3(I, G, Z) {
    if (I.type !== G.type) return !1;
    if (I.type === "text") return hg3(I, G);
    if (G = G, I.name !== G.name) return !1;
    let d = Z.find(W => W.name === I.name);
    if (!d) return W0(`Tool ${I.name} not found in tools`), !1;
    if (d.inputsEqual) return d.inputsEqual(I.input, G.input); else return U51(I.input, G.input);
}

function O$2(I, G, Z) {
    if (I.length !== G.length) return !1;
    return R51(I, G).every(([ d, W ]) => cg3(d, W, Z));
}

async function pg3(I, G) {
    let d = G.options.tools.find(w => w.name === I.name);
    if (!d) return !1;
    let W = I.input, B = SU1(d, W);
    return d.validateInput ? (await d.validateInput(B, G)).result : !0;
}

async function m$2(I, G, Z) {
    let d = () => y$2(!0, I, G), W = A => y$2(!1, I, G, A), B = I.message.content.filter(A => A.type !== "thinking" && A.type !== "redacted_thinking"), w = G.message.content.filter(A => A.type !== "thinking" && A.type !== "redacted_thinking");
    if (!(B.some(A => A.type === "tool_use") || w.some(A => A.type === "tool_use"))) {
        if (O$2(B, w, Z.options.tools)) return W("contents_identical"), !1;
        return d(), !0;
    }
    let C = B.filter(A => A.type === "tool_use"), X = w.filter(A => A.type === "tool_use");
    if (!(await Promise.all([ ...C, ...X ].map(A => pg3(A, Z)))).every(Boolean)) return W("tool_use_invalid"), 
    !1;
    try {
        if (O$2(C, X, Z.options.tools)) return W("contents_identical"), !1;
    } catch {
        return W("tool_use_invalid_with_error"), !1;
    }
    return d(), !0;
}

import {
    existsSync as uE,
    mkdirSync as IU3,
    readFileSync as LU1,
    statSync as h$2
} from "fs";

var J6 = A1(u1(), 1);

import {
    dirname as GU3,
    isAbsolute as FT,
    relative as c$2,
    resolve as p$2,
    sep as ZU3
} from "path";

import {
    existsSync as ig3,
    readFileSync as j$2
} from "fs";

var BZ = A1(u1(), 1);

import {
    extname as ng3,
    isAbsolute as l$2,
    relative as ag3,
    resolve as k$2
} from "path";

var T$2 = "Replace the contents of a specific cell in a Jupyter notebook.", b$2 = "Completely replaces the contents of a specific cell in a Jupyter notebook (.ipynb file) with new source. Jupyter notebooks are interactive documents that combine code, text, and visualizations, commonly used for data analysis and scientific computing. The notebook_path parameter must be an absolute path, not a relative path. The cell_number is 0-indexed. Use edit_mode=insert to add a new cell at the index specified by cell_number. Use edit_mode=delete to delete the cell at the index specified by cell_number.";

var rg3 = e.strictObject({
    notebook_path: e.string().describe("The absolute path to the Jupyter notebook file to edit (must be absolute, not relative)"),
    cell_number: e.number().describe("The index of the cell to edit (0-based)"),
    new_source: e.string().describe("The new source for the cell"),
    cell_type: e.enum([ "code", "markdown" ]).optional().describe("The type of the cell (code or markdown). If not specified, it defaults to the current cell type. If using edit_mode=insert, this is required."),
    edit_mode: e.string().optional().describe("The type of edit to make (replace, insert, delete). Defaults to replace.")
}), HG = {
    name: "NotebookEditCell",
    async description() {
        return T$2;
    },
    async prompt() {
        return b$2;
    },
    userFacingName() {
        return "Edit Notebook";
    },
    async isEnabled() {
        return !0;
    },
    inputSchema: rg3,
    isReadOnly() {
        return !1;
    },
    getPath(I) {
        return I.notebook_path;
    },
    needsPermissions(I, {
        writeFileAllowedDirectories: G
    }) {
        return !QE(HG.getPath(I), G);
    },
    renderResultForAssistant({
        cell_number: I,
        edit_mode: G,
        new_source: Z,
        error: d
    }) {
        if (d) return d;
        switch (G) {
          case "replace":
            return `Updated cell ${I} with ${Z}`;

          case "insert":
            return `Inserted cell ${I} with ${Z}`;

          case "delete":
            return `Deleted cell ${I}`;
        }
    },
    renderToolUseMessage(I, {
        verbose: G
    }) {
        return `notebook_path: ${G ? I.notebook_path : ag3(u0(), I.notebook_path)}, cell: ${I.cell_number}, content: ${I.new_source.slice(0, 30)}…, cell_type: ${I.cell_type}, edit_mode: ${I.edit_mode ?? "replace"}`;
    },
    renderToolUseRejectedMessage() {
        return BZ.createElement(E5, null);
    },
    renderToolResultMessage({
        cell_number: I,
        new_source: G,
        language: Z,
        error: d
    }) {
        if (d) return BZ.createElement(p, {
            flexDirection: "column"
        }, BZ.createElement(O, {
            color: "red"
        }, d));
        return BZ.createElement(p, {
            flexDirection: "column"
        }, BZ.createElement(O, null, "Updated cell ", I, ":"), BZ.createElement(p, {
            marginLeft: 2
        }, BZ.createElement(SX, {
            code: G,
            language: Z
        })));
    },
    async validateInput({
        notebook_path: I,
        cell_number: G,
        cell_type: Z,
        edit_mode: d = "replace"
    }) {
        let W = l$2(I) ? I : k$2(u0(), I);
        if (!ig3(W)) return {
            result: !1,
            message: "Notebook file does not exist."
        };
        if (ng3(W) !== ".ipynb") return {
            result: !1,
            message: "File must be a Jupyter notebook (.ipynb file). For editing other file types, use the FileEdit tool."
        };
        if (G < 0) return {
            result: !1,
            message: "Cell number must be non-negative."
        };
        if (d !== "replace" && d !== "insert" && d !== "delete") return {
            result: !1,
            message: "Edit mode must be replace, insert, or delete."
        };
        if (d === "insert" && !Z) return {
            result: !1,
            message: "Cell type is required when using edit_mode=insert."
        };
        let B = pG(W), w = j$2(W, B), V = Hw(w);
        if (!V) return {
            result: !1,
            message: "Notebook is not valid JSON."
        };
        if (d === "insert" && G > V.cells.length) return {
            result: !1,
            message: `Cell number is out of bounds. For insert mode, the maximum value is ${V.cells.length} (to append at the end).`
        }; else if ((d === "replace" || d === "delete") && (G >= V.cells.length || !V.cells[G])) return {
            result: !1,
            message: `Cell number is out of bounds. Notebook has ${V.cells.length} cells.`
        };
        return {
            result: !0
        };
    },
    async *call({
        notebook_path: I,
        cell_number: G,
        new_source: Z,
        cell_type: d,
        edit_mode: W
    }) {
        let B = l$2(I) ? I : k$2(u0(), I);
        try {
            let w = pG(B), V = j$2(B, w), C = JSON.parse(V), X = C.metadata.language_info?.name ?? "python";
            if (W === "delete") C.cells.splice(G, 1); else if (W === "insert") {
                let D = {
                    cell_type: d,
                    source: Z,
                    metadata: {}
                };
                C.cells.splice(G, 0, d == "markdown" ? D : {
                    ...D,
                    outputs: []
                });
            } else {
                let D = C.cells[G];
                if (D.source = Z, D.execution_count = void 0, D.outputs = [], d && d !== D.cell_type) D.cell_type = d;
            }
            let Y = nz(B);
            eY(B, JSON.stringify(C, null, 1), w, Y);
            let A = {
                cell_number: G,
                new_source: Z,
                cell_type: d ?? "code",
                language: X,
                edit_mode: W ?? "replace",
                error: ""
            };
            yield {
                type: "result",
                data: A,
                resultForAssistant: this.renderResultForAssistant(A)
            };
        } catch (w) {
            if (w instanceof Error) {
                let C = {
                    cell_number: G,
                    new_source: Z,
                    cell_type: d ?? "code",
                    language: "python",
                    edit_mode: "replace",
                    error: w.message
                };
                yield {
                    type: "result",
                    data: C,
                    resultForAssistant: this.renderResultForAssistant(C)
                };
                return;
            }
            let V = {
                cell_number: G,
                new_source: Z,
                cell_type: d ?? "code",
                language: "python",
                edit_mode: "replace",
                error: "Unknown error occurred while editing notebook"
            };
            yield {
                type: "result",
                data: V,
                resultForAssistant: this.renderResultForAssistant(V)
            };
        }
    }
};

var x$2 = `This is a tool for editing files. For moving or renaming files, you should generally use the Bash tool with the 'mv' command instead. For larger edits, use the Write tool to overwrite files. For Jupyter notebooks (.ipynb files), use the ${HG.name} instead.

Before using this tool:

1. Use the View tool to understand the file's contents and context

2. Verify the directory path is correct (only applicable when creating new files):
   - Use the LS tool to verify the parent directory exists and is the correct location

To make a file edit, provide the following:
1. file_path: The absolute path to the file to modify (must be absolute, not relative)
2. old_string: The text to replace (must be unique within the file, and must match the file contents exactly, including all whitespace and indentation)
3. new_string: The edited text to replace the old_string

The tool will replace ONE occurrence of old_string with new_string in the specified file.

CRITICAL REQUIREMENTS FOR USING THIS TOOL:

1. UNIQUENESS: The old_string MUST uniquely identify the specific instance you want to change. This means:
   - Include AT LEAST 3-5 lines of context BEFORE the change point
   - Include AT LEAST 3-5 lines of context AFTER the change point
   - Include all whitespace, indentation, and surrounding code exactly as it appears in the file

2. SINGLE INSTANCE: This tool can only change ONE instance at a time. If you need to change multiple instances:
   - Make separate calls to this tool for each instance
   - Each call must uniquely identify its specific instance using extensive context

3. VERIFICATION: Before using this tool:
   - Check how many instances of the target text exist in the file
   - If multiple instances exist, gather enough context to uniquely identify each one
   - Plan separate tool calls for each instance

WARNING: If you do not follow these requirements:
   - The tool will fail if old_string matches multiple locations
   - The tool will fail if old_string doesn't match exactly (including whitespace)
   - You may change the wrong instance if you don't include enough context

When making edits:
   - Ensure the edit results in idiomatic, correct code
   - Do not leave the code in a broken state
   - Always use absolute file paths (starting with /)

If you want to create a new file, use:
   - A new file path, including dir name if needed
   - An empty old_string
   - The new file's contents as new_string

Remember: when making multiple file edits in a row to the same file, you should prefer to send all edits in a single message with multiple calls to this tool, rather than multiple messages with a single call each.
`;

import {
    resolve as sg3
} from "path";

import {
    readFileSync as og3
} from "fs";

function eg3(I) {
    let G = sg3(u0(), I), Z = pG(G);
    return og3(G, Z);
}

function tg3(I, G, Z) {
    if (Z !== "") return I.replace(G, () => Z);
    return !G.endsWith(`
`) && I.includes(G + `
`) ? I.replace(G + `
`, () => Z) : I.replace(G, () => Z);
}

function DT(I, G, Z) {
    let d = G === "" ? "" : eg3(I), W = G === "" ? Z : tg3(d, G, Z);
    if (W === d) throw new Error("Original and edited file match exactly. Failed to apply edit.");
    return {
        patch: G_({
            filePath: I,
            fileContents: d,
            oldStr: d,
            newStr: W
        }),
        updatedFile: W
    };
}

var dU3 = e.strictObject({
    file_path: e.string().describe("The absolute path to the file to modify"),
    old_string: e.string().describe("The text to replace"),
    new_string: e.string().describe("The text to replace it with")
}), i$2 = 4, WU3 = {
    "<fnr>": "<function_results>",
    "<n>": "<name>",
    "</n>": "</name>",
    "<o>": "<output>",
    "</o>": "</output>",
    "<e>": "<error>",
    "</e>": "</error>",
    "<s>": "<system>",
    "</s>": "</system>",
    "<r>": "<result>",
    "</r>": "</result>",
    "< META_START >": "<META_START>",
    "< META_END >": "<META_END>",
    "< EOT >": "<EOT>",
    "< META >": "<META>",
    "< SOS >": "<SOS>",
    "\n\nH:": `

Human:`,
    "\n\nA:": `

Assistant:`
};

function BU3(I) {
    let G = I, Z = [];
    for (let [ d, W ] of Object.entries(WU3)) {
        let B = G;
        if (G = G.replaceAll(d, W), B !== G) Z.push({
            from: d,
            to: W
        });
    }
    return {
        result: G,
        appliedReplacements: Z
    };
}

function n$2(I) {
    let {
        file_path: G,
        old_string: Z,
        new_string: d
    } = I;
    if (!Z) return I;
    try {
        let W = LX(G), B = pG(W), w = LU1(W, B);
        if (w.includes(Z)) return I;
        let {
            result: V,
            appliedReplacements: C
        } = BU3(Z);
        if (w.includes(V)) {
            let X = d;
            for (let {
                from: Y,
                to: A
            } of C) X = X.replaceAll(Y, A);
            return {
                file_path: G,
                old_string: V,
                new_string: X
            };
        }
    } catch (W) {
        W0(W);
    }
    return I;
}

var DG = {
    name: "Edit",
    async description() {
        return "A tool for editing files";
    },
    async prompt() {
        return x$2;
    },
    userFacingName({
        old_string: I
    }) {
        if (I === "") return "Create";
        return "Update";
    },
    async isEnabled() {
        return !0;
    },
    inputSchema: dU3,
    isReadOnly() {
        return !1;
    },
    getPath(I) {
        return I.file_path;
    },
    needsPermissions(I, {
        writeFileAllowedDirectories: G
    }) {
        return !QE(I.file_path, G);
    },
    renderToolUseMessage(I, {
        verbose: G
    }) {
        return `file_path: ${G ? I.file_path : c$2(u0(), I.file_path)}`;
    },
    renderToolResultMessage({
        filePath: I,
        structuredPatch: G
    }, {
        verbose: Z
    }) {
        return J6.createElement(O11, {
            filePath: I,
            structuredPatch: G,
            verbose: Z
        });
    },
    renderToolUseRejectedMessage({
        file_path: I,
        old_string: G,
        new_string: Z
    }, {
        columns: d,
        verbose: W
    }) {
        try {
            let {
                patch: B
            } = DT(I, G, Z);
            return J6.createElement(p, {
                flexDirection: "column"
            }, J6.createElement(O, null, "  ", "⎿", " ", J6.createElement(O, {
                color: e1().error
            }, "User rejected ", G === "" ? "write" : "update", " to", " "), J6.createElement(O, {
                bold: !0
            }, W ? I : c$2(u0(), I))), vB(B.map(w => J6.createElement(p, {
                flexDirection: "column",
                paddingLeft: 5,
                key: w.newStart
            }, J6.createElement(EB, {
                patch: w,
                dim: !0,
                width: d - 12
            }))), w => J6.createElement(p, {
                paddingLeft: 5,
                key: `ellipsis-${w}`
            }, J6.createElement(O, {
                color: e1().secondaryText
            }, "..."))));
        } catch (B) {
            return W0(B), J6.createElement(p, {
                flexDirection: "column"
            }, J6.createElement(O, null, "  ", "⎿ (No changes)"));
        }
    },
    async validateInput({
        file_path: I,
        old_string: G,
        new_string: Z
    }, {
        readFileTimestamps: d
    }) {
        if (G === Z) return {
            result: !1,
            message: "No changes to make: old_string and new_string are exactly the same.",
            meta: {
                old_string: G
            }
        };
        let W = FT(I) ? I : p$2(u0(), I);
        if (gD(W)) return {
            result: !1,
            message: "File is in a directory that is ignored by your project configuration."
        };
        if (uE(W) && G === "") return {
            result: !1,
            message: "Cannot create new file - file already exists."
        };
        if (!uE(W) && G === "") return {
            result: !0
        };
        if (!uE(W)) {
            let A = nf(W), D = "File does not exist.";
            if (A) D += ` Did you mean ${A}?`;
            return {
                result: !1,
                message: D
            };
        }
        if (W.endsWith(".ipynb")) return {
            result: !1,
            message: `File is a Jupyter Notebook. Use the ${HG.name} to edit this file.`
        };
        let B = d[W];
        if (!B) return {
            result: !1,
            message: "File has not been read yet. Read it first before writing to it.",
            meta: {
                isFilePathAbsolute: String(FT(I))
            }
        };
        if (h$2(W).mtimeMs > B) return {
            result: !1,
            message: "File has been modified since read, either by the user or by a linter. Read it again before attempting to write it."
        };
        let C = pG(W), X = LU1(W, C);
        if (!X.includes(G)) return {
            result: !1,
            message: "String to replace not found in file.",
            meta: {
                isFilePathAbsolute: String(FT(I))
            }
        };
        let Y = X.split(G).length - 1;
        if (Y > 1) return {
            result: !1,
            message: `Found ${Y} matches of the string to replace. For safety, this tool only supports replacing exactly one occurrence at a time. Add more lines of context to your edit and try again.`,
            meta: {
                isFilePathAbsolute: String(FT(I))
            }
        };
        return {
            result: !0
        };
    },
    inputsEqual(I, G) {
        if (I.file_path !== G.file_path) return !1;
        let Z = DT(I.file_path, I.old_string, I.new_string), d = DT(G.file_path, G.old_string, G.new_string);
        return Z.updatedFile === d.updatedFile;
    },
    async *call({
        file_path: I,
        old_string: G,
        new_string: Z
    }, {
        readFileTimestamps: d
    }) {
        let {
            patch: W,
            updatedFile: B
        } = DT(I, G, Z), w = FT(I) ? I : p$2(u0(), I), V = GU3(w);
        IU3(V, {
            recursive: !0
        });
        let C = uE(w) ? pG(w) : "utf8", X = uE(w) ? nz(w) : "LF", Y = uE(w) ? LU1(w, C) : "";
        if (eY(w, B, C, X), d[w] = h$2(w).mtimeMs, w.endsWith(`${ZU3}CLAUDE.md`)) B0("tengu_write_claudemd", {});
        HT(W);
        let A = {
            filePath: I,
            oldString: G,
            newString: Z,
            originalFile: Y,
            structuredPatch: W
        };
        yield {
            type: "result",
            data: A,
            resultForAssistant: this.renderResultForAssistant(A)
        };
    },
    renderResultForAssistant({
        filePath: I,
        originalFile: G,
        oldString: Z,
        newString: d
    }) {
        let {
            snippet: W,
            startLine: B
        } = wU3(G || "", Z, d);
        return `The file ${I} has been updated. Here's the result of running \`cat -n\` on a snippet of the edited file:
${af({
            content: W,
            startLine: B
        })}`;
    }
};

function wU3(I, G, Z) {
    let W = (I.split(G)[0] ?? "").split(/\r?\n/).length - 1, B = I.replace(G, Z).split(/\r?\n/), w = Math.max(0, W - i$2), V = W + i$2 + Z.split(/\r?\n/).length;
    return {
        snippet: B.slice(w, V + 1).join(`
`),
        startLine: w + 1
    };
}

var a$2 = Symbol("NO_VALUE");

async function Z_(I) {
    let G = a$2;
    for await (let Z of I) G = Z;
    if (G === a$2) throw new Error("No items in generator");
    return G;
}

async function* r$2(I, G = 1 / 0) {
    let Z = B => {
        let w = B.next().then(({
            done: V,
            value: C
        }) => ({
            done: V,
            value: C,
            generator: B,
            promise: w
        }));
        return w;
    }, d = [ ...I ], W = new Set();
    while (W.size < G && d.length > 0) {
        let B = d.shift();
        W.add(Z(B));
    }
    while (W.size > 0) {
        let {
            done: B,
            value: w,
            generator: V,
            promise: C
        } = await Promise.race(W);
        if (W.delete(C), !B) {
            if (W.add(Z(V)), w !== void 0) yield w;
        } else if (d.length > 0) {
            let X = d.shift();
            W.add(Z(X));
        }
    }
}

var VU3 = 10;

async function CU3(I, G, Z) {
    {
        let B = await G();
        if (I.abortController.signal.aborted) return {
            message: null,
            shouldSkipPermissionCheck: !1
        };
        return {
            message: B,
            shouldSkipPermissionCheck: !1
        };
    }
    let [ d, W ] = await Promise.all([ G(), G() ]);
    if (I.abortController.signal.aborted) return {
        message: null,
        shouldSkipPermissionCheck: !1
    };
    if (W.isApiErrorMessage) return {
        message: d,
        shouldSkipPermissionCheck: !1
    };
    if (d.isApiErrorMessage) return {
        message: W,
        shouldSkipPermissionCheck: !1
    };
    if (!await m$2(d, W, I)) return {
        message: d,
        shouldSkipPermissionCheck: !1
    };
    return await Z(d, W);
}

async function* TX(I, G, Z, d, W, B, w) {
    let V = D$2(G, Z);
    function C() {
        return VT(yE(I), V, W.options.maxThinkingTokens, W.options.tools, W.abortController.signal, {
            permissionMode: W.options.permissionMode ?? "default",
            model: W.options.slowAndCapableModel,
            prependCLISysprompt: !0,
            toolChoice: void 0
        });
    }
    let X = await CU3(W, C, w);
    if (X.message === null) {
        yield K6({
            content: IW,
            surface: "both"
        });
        return;
    }
    let {
        message: Y,
        shouldSkipPermissionCheck: A
    } = X;
    yield Y;
    let D = Y.message.content.filter(z => z.type === "tool_use");
    if (!D.length) return;
    let J = [];
    for await (let z of s$2(D, Y, d, W, B, A)) if (yield z, z.type === "user" && z.surface !== "client") J.push(z);
    if (W.abortController.signal.aborted) {
        yield K6({
            content: DV,
            surface: "both"
        });
        return;
    }
    let K = J.sort((z, Q) => {
        let U = D.findIndex(S => S.id === z.message.content[0].id), M = D.findIndex(S => S.id === Q.message.content[0].id);
        return U - M;
    });
    yield* await TX([ ...I, Y, ...K ], G, Z, d, W, B, w);
}

async function* s$2(I, G, Z, d, W, B) {
    if (I.every(w => d.options.tools.find(V => V.name === w.name)?.isReadOnly(w.input))) yield* YU3(I, G, Z, d, W, B); else yield* XU3(I, G, Z, d, W, B);
}

async function* XU3(I, G, Z, d, W, B) {
    for (let w of I) yield* PU1(w, new Set(I.map(V => V.id)), G, Z, d, W, B);
}

async function* YU3(I, G, Z, d, W, B) {
    yield* r$2(I.map(w => PU1(w, new Set(I.map(V => V.id)), G, Z, d, W, B)), VU3);
}

async function* PU1(I, G, Z, d, W, B, w) {
    let V = I.name, C = W.options.tools.find(Y => Y.name === V);
    if (!C) {
        B0("tengu_tool_use_error", {
            error: `No such tool available: ${V}`,
            messageID: Z.message.id,
            toolName: V,
            toolUseID: I.id
        }), yield h9({
            content: [ {
                type: "tool_result",
                content: `Error: No such tool available: ${V}`,
                is_error: !0,
                tool_use_id: I.id
            } ],
            surface: "both"
        });
        return;
    }
    let X = I.input;
    try {
        if (W.abortController.signal.aborted) {
            B0("tengu_tool_use_cancelled", {
                toolName: C.name,
                toolUseID: I.id
            }), yield h9({
                content: [ e$2(I.id) ],
                surface: "both"
            });
            return;
        }
        for await (let Y of AU3(C, I.id, G, X, W, d, Z, B, w)) yield Y;
    } catch (Y) {
        W0(Y), yield h9({
            content: [ {
                type: "tool_result",
                content: "Error calling tool",
                is_error: !0,
                tool_use_id: I.id
            } ],
            surface: "both"
        });
    }
}

function SU1(I, G) {
    switch (I) {
      case j4:
        {
            let {
                command: Z,
                timeout: d
            } = j4.inputSchema.parse(G), W = Z.replace(`cd ${u0()} && `, "");
            if (/^echo\s+["']?[^|&;><]*["']?$/i.test(W.trim())) B0("bash_tool_simple_echo", {});
            return {
                command: W,
                ...d ? {
                    timeout: d
                } : {}
            };
        }

      case DG:
        return n$2(G);

      default:
        return G;
    }
}

async function* AU3(I, G, Z, d, W, B, w, V, C) {
    let X = I.inputSchema.safeParse(d);
    if (!X.success) {
        B0("tengu_tool_use_error", {
            error: `InputValidationError: ${X.error.message}`,
            messageID: w.message.id,
            toolName: I.name
        }), yield h9({
            content: [ {
                type: "tool_result",
                content: `InputValidationError: ${X.error.message}`,
                is_error: !0,
                tool_use_id: G
            } ],
            surface: "both"
        });
        return;
    }
    let Y = SU1(I, d), A = await I.validateInput?.(Y, W);
    if (A?.result === !1) {
        B0("tengu_tool_use_error", {
            error: A?.message.slice(0, 2e3),
            messageID: w.message.id,
            toolName: I.name,
            ...A?.meta ?? {}
        }), yield h9({
            content: [ {
                type: "tool_result",
                content: A.message,
                is_error: !0,
                tool_use_id: G
            } ],
            surface: "both"
        });
        return;
    }
    let D = C ? {
        result: !0
    } : await B(I, Y, W, w, V);
    if (D.result === !1) {
        yield h9({
            content: [ {
                type: "tool_result",
                content: D.message,
                is_error: !0,
                tool_use_id: G
            } ],
            surface: "both"
        });
        return;
    }
    try {
        let J = I.call(Y, W, B, w, V);
        for await (let K of J) switch (K.type) {
          case "result":
            B0("tengu_tool_use_success", {
                messageID: w.message.id,
                toolName: I.name
            }), yield h9({
                content: [ {
                    type: "tool_result",
                    content: K.resultForAssistant,
                    tool_use_id: G
                } ],
                surface: "both",
                toolUseResult: {
                    data: K.data,
                    resultForAssistant: K.resultForAssistant
                }
            });
            break;

          case "progress":
            B0("tengu_tool_use_progress", {
                messageID: w.message.id,
                toolName: I.name
            }), yield o$2(K.toolUseID, K.parentMessageID, Z, K.content, K.normalizedMessages, K.tools, K.isResolved);
            break;
        }
    } catch (J) {
        let K = _U3(J);
        W0(J), B0("tengu_tool_use_error", {
            error: K.slice(0, 2e3),
            messageID: w.message.id,
            toolName: I.name
        }), yield h9({
            content: [ {
                type: "tool_result",
                content: K,
                is_error: !0,
                tool_use_id: G
            } ],
            surface: "both"
        });
    }
}

function _U3(I) {
    if (!(I instanceof Error)) return String(I);
    let Z = HU3(I).filter(Boolean).join(`
`).trim() || "Error";
    if (Z.length <= 1e4) return Z;
    let d = 5e3, W = Z.slice(0, d), B = Z.slice(-d);
    return `${W}

... [${Z.length - 1e4} characters truncated] ...

${B}`;
}

function HU3(I) {
    if (I instanceof Iz) return [ I.interrupted ? DV : "", I.stderr, I.stdout ];
    let G = [ I.message ];
    if ("stderr" in I && typeof I.stderr === "string") G.push(I.stderr);
    if ("stdout" in I && typeof I.stdout === "string") G.push(I.stdout);
    return G;
}

var uU1 = null, GS2 = null, T11 = JU3(_w, "CLAUDE.md"), m11 = OU1(_w, ".memory", "snapshots"), KU3 = 2e4, ZS2 = 5;

var io5 = `You have been asked to add a memory to CLAUDE.md file at ${T11}.

Please follow these guidelines:
- Organize the memories as follows:
  - Personal preferences or memories that apply to all projects should be at the top of the file under "# User Preferences" or similar heading
  - Project-specific memories should be organized under project-specific sections
  - Group all memories for the same project together in that section. When saving a project-specific memory, create or update a section with a heading like "# Project: /path/to/project". Do not create a project section if the memory does not apply to a specific project.
  - Do not repeat the project path for each memory item; just use the section heading
- For new memories:
  - If it's a project-specific memory (build command, project workflow, etc.), add it to the appropriate project section
  - If it's a global preference, add it to the personal preferences section. 
  - If unsure if something is global or project specific, default to global
- Preserve the existing structure of the file and integrate new memories naturally
- Do not elaborate on the memory or add unnecessary commentary
- Use the FileWriteTool to write the updated content to the CLAUDE.md file
- IMPORTANT: Your response MUST be a single tool use for the FileWriteTool`;

function zU3() {
    if (!yU1(T11)) return "";
    return dS2(T11, "utf-8");
}

async function QU3() {
    try {
        let I = await BS2();
        if (I.length > ZS2) {
            let G = I.slice(ZS2);
            for (let Z of G) try {
                FU3(Z);
            } catch (d) {
                W0(`Failed to delete old snapshot ${Z}: ${d}`);
            }
        }
    } catch (I) {
        W0(`Error pruning old snapshots: ${I}`);
    }
}

function NU3() {
    let I = zU3();
    if (!I.trim()) return null;
    try {
        let G = new Date().toISOString().replace(/:/g, "-"), Z = OU1(m11, `${G}_CLAUDE.md`);
        if (!yU1(IS2(Z))) DU3(IS2(Z), {
            recursive: !0
        });
        return eY(Z, I, "utf-8", "LF"), QU3(), Z;
    } catch (G) {
        return W0(`Error saving memory snapshot: ${G}`), null;
    }
}

async function WS2() {
    if (!uU1 || Date.now() - uU1 > KU3) return;
    try {
        let I = await qU3();
        GS2?.addNotification?.(I, {
            color: "remember"
        });
    } catch (I) {
        GS2?.addNotification?.(`Error undoing memory: ${I}`, {
            color: "error"
        });
    }
}

async function qU3() {
    try {
        let I = await BS2();
        if (I.length === 0) return "No memory snapshots found to restore from.";
        let G = I[0];
        if (!G) return "Failed to get a valid snapshot to restore.";
        let Z = dS2(G, "utf-8");
        return NU3(), eY(T11, Z, "utf-8", "LF"), uU1 = null, "Memory undone. Use /edit_memory to review your memories.";
    } catch (I) {
        return W0(`Error restoring memory snapshot: ${I}`), `Failed to restore memory from snapshot: ${I}`;
    }
}

async function BS2() {
    if (!yU1(m11)) return [];
    try {
        let G = (await t$2.readdir(m11)).filter(d => d.endsWith("_CLAUDE.md")).map(d => OU1(m11, d));
        return (await Promise.all(G.map(async d => {
            let W = await t$2.stat(d);
            return {
                file: d,
                mtime: W.mtime
            };
        }))).sort((d, W) => W.mtime.getTime() - d.mtime.getTime()).map(d => d.file);
    } catch (I) {
        return W0(`Error getting memory snapshots: ${I}`), [];
    }
}

var gU3 = "[Image pasted]";

function wS2(I) {
    return function(G) {
        return (new Map(I).get(G) ?? (() => {}))(G);
    };
}

function b11({
    value: I,
    onChange: G,
    onSubmit: Z,
    onExit: d,
    onExitMessage: W,
    onMessage: B,
    onHistoryUp: w,
    onHistoryDown: V,
    onHistoryReset: C,
    mask: X = "",
    multiline: Y = !1,
    cursorChar: A,
    invert: D,
    columns: J,
    onImagePaste: K,
    disableCursorMovementForUpDownKeys: z = !1,
    externalOffset: Q,
    onOffsetChange: U
}) {
    let M = Q, S = U, L = W8.fromText(I, J, M), [ P, m ] = VS2.useState(null);
    function j() {
        if (!P) return;
        clearTimeout(P), m(null), B?.(!1);
    }
    let V1 = sz(J0 => {
        j(), W?.(J0, "Ctrl-C");
    }, () => d?.(), () => {
        if (I) G(""), C?.();
    }), k = sz(J0 => {
        j(), B?.(!!I && J0, "Press Escape again to clear");
    }, () => {
        if (I) G("");
    });
    function j1() {
        return W8.fromText("", J, 0);
    }
    let H1 = sz(J0 => W?.(J0, "Ctrl-D"), () => d?.());
    function $1() {
        if (j(), L.text === "") return H1(), L;
        return L.del();
    }
    function F1() {
        let J0 = zW0();
        if (J0 === null) {
            if (process.platform !== "darwin") return L;
            return B?.(!0, KW0), j(), m(setTimeout(() => {
                B?.(!1);
            }, 4e3)), L;
        }
        return K?.(J0), L.insert(gU3);
    }
    function u() {
        return WS2(), L;
    }
    let I1 = wS2([ [ "a", () => L.startOfLine() ], [ "b", () => L.left() ], [ "c", V1 ], [ "d", $1 ], [ "e", () => L.endOfLine() ], [ "f", () => L.right() ], [ "h", () => L.backspace() ], [ "k", () => L.deleteToLineEnd() ], [ "l", () => j1() ], [ "n", () => N0() ], [ "p", () => a1() ], [ "u", () => L.deleteToLineStart() ], [ "v", F1 ], [ "w", () => L.deleteWordBefore() ] ]), m1 = wS2([ [ "b", () => L.prevWord() ], [ "f", () => L.nextWord() ], [ "d", () => L.deleteWordAfter() ] ]);
    function l1(J0) {
        if (Y && L.offset > 0 && L.text[L.offset - 1] === "\\") return H20(), L.backspace().insert(`
`);
        if (J0.meta) return L.insert(`
`);
        Z?.(I);
    }
    function a1() {
        if (z) return w?.(), L;
        let J0 = L.up();
        if (J0.equals(L)) w?.();
        return J0;
    }
    function N0() {
        if (z) return V?.(), L;
        let J0 = L.down();
        if (J0.equals(L)) V?.();
        return J0;
    }
    function f0(J0) {
        switch (!0) {
          case J0.escape:
            return k;

          case J0.leftArrow && (J0.ctrl || J0.meta || J0.fn):
            return () => L.prevWord();

          case J0.rightArrow && (J0.ctrl || J0.meta || J0.fn):
            return () => L.nextWord();

          case J0.backspace:
            return J0.meta ? () => L.deleteWordBefore() : () => L.backspace();

          case J0.delete:
            return J0.meta ? () => L.deleteToLineEnd() : () => L.del();

          case J0.ctrl:
            return I1;

          case J0.home:
            return () => L.startOfLine();

          case J0.end:
            return () => L.endOfLine();

          case J0.pageDown:
            return () => L.endOfLine();

          case J0.pageUp:
            return () => L.startOfLine();

          case J0.meta:
            return m1;

          case J0.return:
            return () => l1(J0);

          case J0.tab:
            if (z) return () => L;
            return u;

          case J0.upArrow:
            return a1;

          case J0.downArrow:
            return N0;

          case J0.leftArrow:
            return () => L.left();

          case J0.rightArrow:
            return () => L.right();
        }
        return function(G1) {
            switch (!0) {
              case G1 == "[H" || G1 == "[1~":
                return L.startOfLine();

              case G1 == "[F" || G1 == "[4~":
                return L.endOfLine();

              default:
                return L.insert(G1.replace(/\r/g, `
`));
            }
        };
    }
    function G2(J0, G1) {
        let f1 = f0(G1)(J0);
        if (f1) {
            if (!L.equals(f1)) {
                if (S(f1.offset), L.text != f1.text) G(f1.text);
            }
        }
    }
    return {
        onInput: G2,
        renderedValue: L.render(A, X, D),
        offset: M,
        setOffset: S
    };
}

var AS2 = A1(u1(), 1);

var CS2 = A1(u1(), 1);

function XS2({
    onPaste: I,
    onInput: G
}) {
    let [ Z, d ] = CS2.default.useState({
        chunks: [],
        timeoutId: null
    }), W = w => {
        if (w) clearTimeout(w);
        return setTimeout(() => {
            d(({
                chunks: V
            }) => {
                let C = V.join("");
                return Promise.resolve().then(() => I && I(C)), {
                    chunks: [],
                    timeoutId: null
                };
            });
        }, 100);
    };
    return {
        wrappedOnInput: (w, V) => {
            if (I && (w.length > 800 || Z.timeoutId)) {
                d(({
                    chunks: C,
                    timeoutId: X
                }) => {
                    return {
                        chunks: [ ...C, w ],
                        timeoutId: W(X)
                    };
                });
                return;
            }
            G(w, V);
        },
        pasteState: Z
    };
}

function YS2({
    placeholder: I,
    value: G,
    showCursor: Z,
    focus: d
}) {
    let W = void 0;
    if (I) {
        if (W = T0.ansi256(g8().secondaryText)(I), Z && d) W = I.length > 0 ? T0.inverse(I[0]) + T0.ansi256(g8().secondaryText)(I.slice(1)) : T0.inverse(" ");
    }
    let B = G.length === 0 && Boolean(I);
    return {
        renderedPlaceholder: W,
        showPlaceholder: B
    };
}

function j11({
    inputState: I,
    children: G,
    ...Z
}) {
    let {
        onInput: d,
        renderedValue: W
    } = I, {
        wrappedOnInput: B
    } = XS2({
        onPaste: Z.onPaste,
        onInput: d
    }), {
        showPlaceholder: w,
        renderedPlaceholder: V
    } = YS2({
        placeholder: Z.placeholder,
        value: Z.value,
        showCursor: Z.showCursor,
        focus: Z.focus
    });
    return _4(B, {
        isActive: Z.focus
    }), AS2.default.createElement(O, {
        wrap: "truncate-end",
        dimColor: Z.isDimmed
    }, w ? V : W, G);
}

function MB(I) {
    let G = g8().text, Z = b11({
        value: I.value,
        onChange: I.onChange,
        onSubmit: I.onSubmit,
        onExit: I.onExit,
        onExitMessage: I.onExitMessage,
        onMessage: I.onMessage,
        onHistoryReset: I.onHistoryReset,
        onHistoryUp: I.onHistoryUp,
        onHistoryDown: I.onHistoryDown,
        focus: I.focus,
        mask: I.mask,
        multiline: I.multiline,
        cursorChar: I.showCursor ? " " : "",
        highlightPastedText: I.highlightPastedText,
        invert: T0.inverse,
        themeText: d => T0.ansi256(G)(d),
        columns: I.columns,
        onImagePaste: I.onImagePaste,
        disableCursorMovementForUpDownKeys: I.disableCursorMovementForUpDownKeys,
        externalOffset: I.cursorOffset,
        onOffsetChange: I.onChangeCursorOffset
    });
    return _S2.default.createElement(j11, {
        inputState: Z,
        ...I
    });
}

async function l11(I) {
    let G = process.platform, Z = G === "win32" ? "start" : G === "darwin" ? "open" : "xdg-open";
    try {
        let {
            code: d
        } = await O3(Z, [ I ]);
        return d === 0;
    } catch (d) {
        return !1;
    }
}

var HS2 = A1(u1(), 1);

function z6(I) {
    let [ G, Z ] = HS2.useState({
        pending: !1,
        keyName: null
    }), d = sz(B => Z({
        pending: B,
        keyName: "Ctrl-C"
    }), I), W = sz(B => Z({
        pending: B,
        keyName: "Ctrl-D"
    }), I);
    return _4((B, w) => {
        if (w.ctrl && B === "c") d();
        if (w.ctrl && B === "d") W();
    }), G;
}

var UU3 = "https://github.com/anthropics/claude-code/issues";

function DS2({
    messages: I,
    onDone: G
}) {
    let [ Z, d ] = $B.useState("userInput"), [ W, B ] = $B.useState(0), [ w, V ] = $B.useState(""), [ C, X ] = $B.useState(null), [ Y, A ] = $B.useState(null), [ D, J ] = $B.useState({
        isGit: !1,
        gitState: null
    }), [ K, z ] = $B.useState(null), Q = Q5().columns - 4;
    $B.useEffect(() => {
        async function L() {
            let P = await ZJ(), m = null;
            if (P) m = await Kq1();
            J({
                isGit: P,
                gitState: m
            });
        }
        L();
    }, []);
    let U = z6(() => process.exit(0)), M = $B.useCallback(async () => {
        d("submitting"), A(null), X(null);
        let L = {
            message_count: I.length,
            datetime: new Date().toISOString(),
            description: w,
            platform: P2.platform,
            gitRepo: D.isGit,
            terminal: P2.terminal,
            version: {
                ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
                PACKAGE_URL: "@anthropic-ai/claude-code",
                README_URL: "https://docs.anthropic.com/s/claude-code",
                VERSION: "0.2.35"
            }.VERSION,
            transcript: I,
            errors: l51()
        }, [ P, m ] = await Promise.all([ vU3(L), RU3(w) ]);
        if (z(m), P.success) {
            if (P.feedbackId) X(P.feedbackId), B0("tengu_bug_report_submitted", {
                feedback_id: P.feedbackId
            });
            d("done");
        } else {
            if (P.isZdrOrg) A("Feedback collection is not available for organizations with custom data retention policies."); else A("Could not submit feedback. Please try again later.");
            d("done");
        }
    }, [ w, D.isGit, I ]);
    _4((L, P) => {
        if (Z === "done") {
            if (P.return && K) {
                let m = fU3(C ?? "", K, w);
                l11(m);
            }
            if (Y) G("<bash-stderr>Error submitting bug report</bash-stderr>"); else G("<bash-stdout>Bug report submitted</bash-stdout>");
            return;
        }
        if (Y) {
            G("<bash-stderr>Error submitting bug report</bash-stderr>");
            return;
        }
        if (P.escape) {
            G("<bash-stderr>Bug report cancelled</bash-stderr>");
            return;
        }
        if (Z === "consent" && (P.return || L === " ")) M();
    });
    let S = e1();
    return I2.createElement(I2.Fragment, null, I2.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: S.permission,
        paddingX: 1,
        paddingBottom: 1,
        gap: 1
    }, I2.createElement(O, {
        bold: !0,
        color: S.permission
    }, "Submit Bug Report"), Z === "userInput" && I2.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, I2.createElement(O, null, "Describe the issue below:"), I2.createElement(MB, {
        value: w,
        onChange: V,
        columns: Q,
        onSubmit: () => d("consent"),
        onExitMessage: () => G("<bash-stderr>Bug report cancelled</bash-stderr>"),
        cursorOffset: W,
        onChangeCursorOffset: B
    }), Y && I2.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, I2.createElement(O, {
        color: "red"
    }, Y), I2.createElement(O, {
        dimColor: !0
    }, "Press any key to close"))), Z === "consent" && I2.createElement(p, {
        flexDirection: "column"
    }, I2.createElement(O, null, "This report will include:"), I2.createElement(p, {
        marginLeft: 2,
        flexDirection: "column"
    }, I2.createElement(O, null, "- Your bug description: ", I2.createElement(O, {
        dimColor: !0
    }, w)), I2.createElement(O, null, "- Environment info:", " ", I2.createElement(O, {
        dimColor: !0
    }, P2.platform, ", ", P2.terminal, ", v", {
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.VERSION)), D.gitState && I2.createElement(O, null, "- Git repo metadata:", " ", I2.createElement(O, {
        dimColor: !0
    }, D.gitState.branchName, D.gitState.commitHash ? `, ${D.gitState.commitHash.slice(0, 7)}` : "", D.gitState.remoteUrl ? ` @ ${D.gitState.remoteUrl}` : "", !D.gitState.isHeadOnRemote && ", not synced", !D.gitState.isClean && ", has local changes")), I2.createElement(O, null, "- Current session transcript")), I2.createElement(p, {
        marginTop: 1
    }, I2.createElement(O, {
        wrap: "wrap",
        dimColor: !0
    }, "We will use your feedback to debug related issues or to improve", " ", b2, "'s functionality (eg. to reduce the risk of bugs occurring in the future). Anthropic will not train generative models using feedback from ", b2, ".")), I2.createElement(p, {
        marginTop: 1
    }, I2.createElement(O, null, "Press ", I2.createElement(O, {
        bold: !0
    }, "Enter"), " to confirm and submit."))), Z === "submitting" && I2.createElement(p, {
        flexDirection: "row",
        gap: 1
    }, I2.createElement(O, null, "Submitting report…")), Z === "done" && I2.createElement(p, {
        flexDirection: "column"
    }, Y ? I2.createElement(O, {
        color: "red"
    }, Y) : I2.createElement(O, {
        color: e1().success
    }, "Thank you for your report!"), C && I2.createElement(O, {
        dimColor: !0
    }, "Feedback ID: ", C), I2.createElement(p, {
        marginTop: 1
    }, I2.createElement(O, null, "Press "), I2.createElement(O, {
        bold: !0
    }, "Enter "), I2.createElement(O, null, "to also create a GitHub issue, or any other key to close.")))), I2.createElement(p, {
        marginLeft: 1
    }, I2.createElement(O, {
        dimColor: !0
    }, U.pending ? I2.createElement(I2.Fragment, null, "Press ", U.keyName, " again to exit") : Z === "userInput" ? I2.createElement(I2.Fragment, null, "Enter to continue · Esc to cancel") : Z === "consent" ? I2.createElement(I2.Fragment, null, "Enter to submit · Esc to cancel") : null)));
}

function fU3(I, G, Z) {
    let d = encodeURIComponent(`**Bug Description**
${Z}

**Environment Info**
- Platform: ${P2.platform}
- Terminal: ${P2.terminal}
- Version: ${{
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.VERSION || "unknown"}
- Feedback ID: ${I}

**Errors**
\`\`\`json
${JSON.stringify(l51())}
\`\`\`
`);
    return `${UU3}/new?title=${encodeURIComponent(G)}&body=${d}&labels=user-reported,bug`;
}

async function RU3(I) {
    let G = await oZ({
        systemPrompt: [ 'Generate a concise issue title (max 80 chars) that captures the key point of this feedback. Do not include quotes or prefixes like "Feedback:" or "Issue:". If you cannot generate a title, just use "User Feedback".' ],
        userPrompt: I
    }), Z = G.message.content[0]?.type === "text" ? G.message.content[0].text : "Bug Report";
    if (Z.startsWith(qB)) return `Bug Report: ${I.slice(0, 60)}${I.length > 60 ? "..." : ""}`;
    return Z;
}

async function vU3(I) {
    try {
        let G = Lw();
        if (!G) return {
            success: !1
        };
        let Z = await fC.post("https://api.anthropic.com/api/claude_cli_feedback", {
            content: JSON.stringify(I)
        }, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": lv,
                "x-api-key": G
            }
        });
        if (Z.status === 200) {
            let d = Z.data;
            if (d?.feedback_id) return {
                success: !0,
                feedbackId: d.feedback_id
            };
            return W0("Failed to submit feedback: request did not return feedback_id"), 
            {
                success: !1
            };
        }
        return W0("Failed to submit feedback:" + Z.status), {
            success: !1
        };
    } catch (G) {
        if (fC.isAxiosError(G) && G.response?.status === 403) {
            let Z = G.response.data;
            if (Z?.error?.type === "permission_error" && Z?.error?.message?.includes("Custom data retention settings")) return W0("Cannot submit feedback becasue custom data retention settings are enabled"), 
            {
                success: !1,
                isZdrOrg: !0
            };
        }
        return W0("Error submitting feedback: " + (G instanceof Error ? G.message : "Unknown error")), 
        {
            success: !1
        };
    }
}

var mU1 = A1(u1(), 1);

var EU3 = {
    type: "local-jsx",
    name: "bug",
    description: `Submit feedback about ${b2}`,
    isEnabled: !0,
    isHidden: !1,
    async call(I, {
        messages: G
    }) {
        return mU1.createElement(DS2, {
            messages: G,
            onDone: I
        });
    },
    userFacingName() {
        return "bug";
    }
}, FS2 = EU3;

import {
    existsSync as JS2,
    readFileSync as KS2
} from "fs";

import {
    join as k11,
    parse as MU3,
    dirname as $U3
} from "path";

import {
    homedir as SU3
} from "os";

var LU3 = "Codebase-specific instructions are shown below. Be sure to adhere to these instructions.", OE = x2(() => {
    let I = [], G = u0();
    while (G !== MU3(G).root) {
        let d = k11(G, "CLAUDE.md");
        if (JS2(d)) I.push(`Contents of ${d}:

${KS2(d, "utf-8")}`);
        G = $U3(G);
    }
    let Z = k11(SU3(), ".claude", "CLAUDE.md");
    if (JS2(Z)) I.push(`Contents of ${Z} (user preferences, not checked into the codebase):

${KS2(Z, "utf-8")}`);
    if (I.length === 0) return "";
    return `${LU3}

${I.reverse().join(`

`)}`;
});

async function zS2() {
    let I = new AbortController(), G = setTimeout(() => I.abort(), 3e3);
    try {
        let Z = await oY([ "--files", "--glob", k11("**", "*", "CLAUDE.md") ], u0(), I.signal);
        if (!Z.length) return null;
        return `NOTE: Additional CLAUDE.md files were found. When working in these directories, make sure to read and follow the instructions in the corresponding CLAUDE.md file:
${Z.map(d => d.startsWith("/") ? d : k11(u0(), d)).map(d => `- ${d}`).join(`
`)}`;
    } catch (Z) {
        return W0(Z), null;
    } finally {
        clearTimeout(G);
    }
}

import {
    existsSync as PU3,
    readFileSync as uU3
} from "fs";

import {
    join as yU3
} from "path";

var OU3 = x2(async () => {
    if (!await ZJ()) return null;
    try {
        let [ I, G, Z, d ] = await Promise.all([ O3("git", [ "branch", "--show-current" ], void 0, void 0, !1).then(({
            stdout: w
        }) => w.trim()), O3("git", [ "rev-parse", "--abbrev-ref", "origin/HEAD" ], void 0, void 0, !1).then(({
            stdout: w
        }) => w.replace("origin/", "").trim()), O3("git", [ "status", "--short" ], void 0, void 0, !1).then(({
            stdout: w
        }) => w.trim()), O3("git", [ "log", "--oneline", "-n", "5" ], void 0, void 0, !1).then(({
            stdout: w
        }) => w.trim()) ]), B = Z.split(`
`).length > 200 ? Z.split(`
`).slice(0, 200).join(`
`) + `
... (truncated because there are more than 200 lines. If you need more information, run "git status" using BashTool)` : Z;
        return `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.
Current branch: ${I}

Main branch (you will usually use this for PRs): ${G}

Status:
${B || "(clean)"}

Recent commits:
${d}`;
    } catch (I) {
        return W0(I), null;
    }
}), FG = x2(async () => {
    let I = OE(), G = E4(), Z = G.dontCrawlDirectory, [ d, W, B ] = await Promise.all([ OU3(), Z ? Promise.resolve("") : TU3(u0(), mU3()), Z ? Promise.resolve("") : zS2() ]);
    return {
        ...G.context,
        ...W ? {
            directoryStructure: W
        } : {},
        ...d ? {
            gitStatus: d
        } : {},
        ...I ? {
            claudeMd: I
        } : {},
        ...B ? {
            descendentClaudeMds: B
        } : {}
    };
});

function mU3() {
    try {
        let I = yU3(u0(), ".gitignore");
        if (!PU3(I)) return [];
        return uU3(I, "utf-8").split(/\r?\n/).filter(G => G.trim());
    } catch (I) {
        return W0(`Error reading .gitignore: ${I}`), [];
    }
}

var TU3 = x2(async function(I, G) {
    let Z;
    try {
        let d = new AbortController();
        setTimeout(() => {
            d.abort();
        }, 1e3);
        let W = await U8(), B = fI.call({
            path: I,
            ignore: G
        }, {
            abortController: d,
            options: {
                commands: [],
                tools: [],
                slowAndCapableModel: W,
                forkNumber: 0,
                messageLogName: "unused",
                maxThinkingTokens: 0,
                allowedToolsFromCLIFlag: []
            },
            readFileTimestamps: {}
        });
        Z = (await Z_(B)).data;
    } catch (d) {
        return W0(d), "";
    }
    return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation. It skips over .gitignore patterns.

${Z}`;
}, (I, G) => `${I}------${G.join(",")}`);

function TU1(I) {
    if (process.platform === "win32") process.title = I ? `✳ ${I}` : I; else process.stdout.write(`\x1B]0;${I ? `✳ ${I}` : ""}\x07`);
}

async function QS2(I) {
    try {
        let Z = (await oZ({
            systemPrompt: [ "Analyze if this message indicates a new conversation topic. If it does, extract a 2-3 word title that captures the new topic. Format your response as a JSON object with two fields: 'isNewTopic' (boolean) and 'title' (string, or null if isNewTopic is false). Only include these fields, no other text." ],
            userPrompt: I,
            enablePromptCaching: !0
        })).message.content.filter(W => W.type === "text").map(W => W.text).join(""), d = Hw(Z);
        if (d && typeof d === "object" && "isNewTopic" in d && "title" in d) {
            if (d.isNewTopic && d.title) TU1(d.title);
        }
    } catch (G) {
        W0(G);
    }
}

function w8() {
    return new Promise(I => {
        process.stdout.write("[2J[3J[H", () => {
            I();
        });
    });
}

async function x11({
    setForkConvoWithMessagesOnTheNextRender: I,
    setMessages: G
}) {
    await w8(), G([]), I([]), FG.cache.clear?.(), OE.cache.clear?.(), await qC(r8());
}

var bU3 = {
    type: "local",
    name: "clear",
    description: "Clear conversation history and free up context",
    isEnabled: !0,
    isHidden: !1,
    async call(I, G) {
        return x11(G), "";
    },
    userFacingName() {
        return "clear";
    }
}, NS2 = bU3;

var jU3 = 10;

async function qS2(I, G, Z = jU3) {
    if (!I.length) return {
        oldMessages: [],
        newMessages: []
    };
    let d = Zd(I), W = 0;
    if (W = kU3(d, G), d[W] && gS2(d[W])) W = W + 1;
    let B = lU3(d, W);
    if (W - B < Z) W = B;
    let w = I.slice(0, W), V = I.slice(W), C = h11(w), X = h11(V);
    if (C.length !== w.length) B0("tengu_compact_old_message_dangling_tool_use", {
        dangling_count: String(w.length - C.length)
    });
    if (X.length !== V.length) B0("tengu_compact_new_message_dangling_tool_use", {
        dangling_count: String(V.length - X.length)
    });
    return {
        oldMessages: C,
        newMessages: X
    };
}

function lU3(I, G) {
    for (let Z = G; Z >= 0; Z--) {
        let d = I[Z];
        if (d && US2(d)) return Z;
    }
    throw new Error("No user text message found before split index");
}

function kU3(I, G) {
    let Z = Math.max(0, I.length - G);
    for (let d = Z; d >= 0; d--) {
        let W = I[d];
        if (W && W.type === "user") return d;
    }
    return Z;
}

var fS2 = 10;

async function RS2(I, G, Z = [], d, W) {
    let {
        oldMessages: B,
        newMessages: w
    } = await qS2(I, G);
    if (B0("tengu_compact", {
        compacted_message_count: String(B.length),
        preserved_message_count: String(w.length)
    }), B.length === 0) throw new Error("Not enough messages to compact");
    let V = h9({
        content: "Provide a detailed but concise summary of our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next.",
        surface: "both"
    }), C = await VT(yE([ ...B, V ]), [ "You are a helpful AI assistant tasked with summarizing conversations." ], 0, Z, d, {
        permissionMode: "default",
        model: W,
        prependCLISysprompt: !0,
        toolChoice: void 0
    }), X = C.message.content, Y = typeof X === "string" ? X : X.length > 0 && X[0]?.type === "text" ? X[0].text : null;
    if (!Y) throw new Error(`Failed to generate conversation summary - response did not contain valid text content - ${C}`); else if (Y.startsWith(qB)) throw new Error(Y);
    let A = [ h9({
        content: "Use the /compact command to summarize older conversation history while preserving recent messages.",
        surface: "both"
    }), C, ...w ];
    return {
        oldMessages: B,
        newMessages: w,
        summaryMessage: C,
        compactedMessages: A
    };
}

var xU3 = {
    type: "local",
    name: "compact",
    description: "Clear conversation history but keep a summary in context",
    isEnabled: !0,
    isHidden: !1,
    async call(I, {
        options: {
            tools: G,
            slowAndCapableModel: Z
        },
        abortController: d,
        messages: W,
        setForkConvoWithMessagesOnTheNextRender: B,
        setMessages: w,
        addNotification: V
    }) {
        if (W.length === 0) return "No messages to compact.";
        try {
            V?.("Compacting your message history…", {
                timeoutMs: 3e4,
                color: "permission"
            });
            let {
                compactedMessages: C,
                oldMessages: X
            } = await RS2(W, fS2, G, d.signal, Z);
            return await w8(), w([]), B(C), FG.cache.clear?.(), OE.cache.clear?.(), 
            V?.(`Compacted ${X.length}/${W.length} messages`, {
                timeoutMs: 1e4,
                color: "success"
            }), "";
        } catch (C) {
            if (V?.("Error compacting messages", {
                timeoutMs: 2e3,
                color: "error"
            }), C instanceof Error && C.message === "Conversation too short to compact") return "Conversation too short to compact.";
            throw W0(C), C;
        }
    },
    userFacingName() {
        return "compact";
    }
}, vS2 = xU3;

var _9 = A1(u1(), 1), bU1 = A1(u1(), 1);

function ES2({
    onClose: I
}) {
    let [ G, Z ] = bU1.useState(Q2()), d = _9.useRef(Q2()), [ W, B ] = bU1.useState(0), w = z6(() => process.exit(0)), V = [ ...[], {
        id: "verbose",
        label: "Verbose output",
        value: G.verbose,
        type: "boolean",
        onChange(C) {
            let X = {
                ...Q2(),
                verbose: C
            };
            i4(X), Z(X);
        }
    }, {
        id: "theme",
        label: "Theme",
        value: G.theme,
        options: [ "light", "dark", "light-daltonized", "dark-daltonized", "light-ansi", "dark-ansi" ],
        type: "enum",
        onChange(C) {
            let X = {
                ...Q2(),
                theme: C
            };
            i4(X), Z(X);
        }
    }, {
        id: "notifChannel",
        label: "Notifications",
        value: G.preferredNotifChannel,
        options: [ "iterm2", "terminal_bell", "iterm2_with_bell", "notifications_disabled" ],
        type: "enum",
        onChange(C) {
            let X = {
                ...Q2(),
                preferredNotifChannel: C
            };
            i4(X), Z(X);
        }
    }, {
        id: "editorMode",
        label: "Editor Mode",
        value: G.editorMode || "emacs",
        options: [ "emacs", "vim" ],
        type: "enum",
        onChange(C) {
            let X = {
                ...Q2(),
                editorMode: C
            };
            i4(X), Z(X), B0("tengu_editor_mode_changed", {
                mode: C,
                source: "config_panel"
            });
        }
    } ];
    return _4((C, X) => {
        if (X.escape) {
            let A = [], D = Boolean(!1), J = Boolean(!1);
            if (D !== J) A.push(`  ⎿  ${J ? "Enabled" : "Disabled"} custom API key`);
            if (G.verbose !== d.current.verbose) A.push(`  ⎿  Set verbose to ${T0.bold(G.verbose)}`);
            if (G.theme !== d.current.theme) A.push(`  ⎿  Set theme to ${T0.bold(G.theme)}`);
            if (G.preferredNotifChannel !== d.current.preferredNotifChannel) A.push(`  ⎿  Set notifications to ${T0.bold(G.preferredNotifChannel)}`);
            if (G.editorMode !== d.current.editorMode) A.push(`  ⎿  Set editor mode to ${T0.bold(G.editorMode || "emacs")}`);
            if (A.length > 0) console.log(T0.ansi256(g8().secondaryText)(A.join(`
`)));
            I();
            return;
        }
        function Y() {
            let A = V[W];
            if (!A || !A.onChange) return;
            if (A.type === "boolean") {
                A.onChange(!A.value);
                return;
            }
            if (A.type === "enum") {
                let J = (A.options.indexOf(A.value) + 1) % A.options.length;
                A.onChange(A.options[J]);
                return;
            }
        }
        if (X.return || C === " ") {
            Y();
            return;
        }
        if (X.upArrow) B(A => Math.max(0, A - 1));
        if (X.downArrow) B(A => Math.min(V.length - 1, A + 1));
    }), _9.createElement(_9.Fragment, null, _9.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: e1().secondaryBorder,
        paddingX: 1,
        marginTop: 1
    }, _9.createElement(p, {
        flexDirection: "column",
        minHeight: 2,
        marginBottom: 1
    }, _9.createElement(O, {
        bold: !0
    }, "Settings"), _9.createElement(O, {
        dimColor: !0
    }, "Configure ", b2, " preferences")), V.map((C, X) => {
        let Y = X === W;
        return _9.createElement(p, {
            key: C.id,
            height: 2,
            minHeight: 2
        }, _9.createElement(p, {
            width: 44
        }, _9.createElement(O, {
            color: Y ? "blue" : void 0
        }, Y ? Y3.pointer : " ", " ", C.label)), _9.createElement(p, null, C.type === "boolean" ? _9.createElement(O, {
            color: Y ? "blue" : void 0
        }, C.value.toString()) : _9.createElement(O, {
            color: Y ? "blue" : void 0
        }, C.value.toString())));
    })), _9.createElement(p, {
        marginLeft: 3
    }, _9.createElement(O, {
        dimColor: !0
    }, w.pending ? _9.createElement(_9.Fragment, null, "Press ", w.keyName, " again to exit") : _9.createElement(_9.Fragment, null, "↑/↓ to select · Enter/Space to change · Esc to close"))));
}

var jU1 = A1(u1(), 1), hU3 = {
    type: "local-jsx",
    name: "config",
    description: "Open config panel",
    isEnabled: !0,
    isHidden: !1,
    async call(I) {
        return jU1.createElement(ES2, {
            onClose: I
        });
    },
    userFacingName() {
        return "config";
    }
}, MS2 = hU3;

var cU3 = {
    type: "local",
    name: "cost",
    description: "Show the total cost and duration of the current session",
    isEnabled: !0,
    isHidden: !1,
    async call() {
        return wq1();
    },
    userFacingName() {
        return "cost";
    }
}, $S2 = cU3;

var Mf3 = A1(ML2(), 1);

var PL2 = A1(u1(), 1);

var W3 = A1(u1(), 1);

import {
    join as $f3
} from "path";

import {
    existsSync as sU1,
    mkdirSync as Sf3,
    appendFileSync as q16,
    readFileSync as Lf3,
    constants as Pf3,
    writeFileSync as uf3,
    unlinkSync as $L2,
    statSync as yf3
} from "fs";

import {
    accessSync as Of3
} from "fs";

var SL2 = A1(VP(), 1);

async function LL2() {
    try {
        let I = await tK("tengu_version_config", {
            minVersion: "0.0.0"
        });
        if (I.minVersion && SL2.lt({
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.VERSION, I.minVersion)) console.error(`
It looks like your version of Claude Code (${{
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.VERSION}) needs an update.
A newer version (${I.minVersion} or higher) is required to continue.

To update, please run:
    claude update

This will ensure you have access to the latest features and improvements.
`), process.exit(1);
    } catch (I) {
        W0(`Error checking minimum version: ${I}`);
    }
}

var gN = $f3(_w, ".update.lock"), mf3 = 3e5;

function Tf3() {
    try {
        if (!sU1(_w)) Sf3(_w, {
            recursive: !0
        });
        if (sU1(gN)) {
            let I = yf3(gN);
            if (Date.now() - I.mtimeMs < mf3) return !1;
            try {
                $L2(gN);
            } catch (Z) {
                return W0(`Failed to remove stale lock file: ${Z}`), !1;
            }
        }
        return uf3(gN, `${process.pid}`, "utf8"), !0;
    } catch (I) {
        return W0(`Failed to acquire lock: ${I}`), !1;
    }
}

function bf3() {
    try {
        if (sU1(gN)) {
            if (Lf3(gN, "utf8") === `${process.pid}`) $L2(gN);
        }
    } catch (I) {
        W0(`Failed to release lock: ${I}`);
    }
}

async function jf3() {
    let I = P2.isRunningWithBun(), G = null;
    if (I) G = await O3("bun", [ "pm", "bin", "-g" ]); else G = await O3("npm", [ "-g", "config", "get", "prefix" ]);
    if (G.code !== 0) return W0(`Failed to check ${I ? "bun" : "npm"} permissions`), 
    null;
    return G.stdout.trim();
}

async function oU1() {
    try {
        let I = await jf3();
        if (!I) return {
            hasPermissions: !1,
            npmPrefix: null
        };
        let G = !1;
        try {
            Of3(I, Pf3.W_OK), G = !0;
        } catch {
            G = !1;
        }
        if (G) return {
            hasPermissions: !0,
            npmPrefix: I
        };
        return W0("Insufficient permissions for global npm install."), {
            hasPermissions: !1,
            npmPrefix: I
        };
    } catch (I) {
        return W0(`Failed to verify npm global install permissions: ${I}`), {
            hasPermissions: !1,
            npmPrefix: null
        };
    }
}

async function r11() {
    let I = new AbortController();
    setTimeout(() => I.abort(), 5e3);
    let G = await O3("npm", [ "view", `${{
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.PACKAGE_URL}@latest`, "version" ], I.signal);
    if (G.code !== 0) return null;
    return G.stdout.trim();
}

async function s11() {
    if (!Tf3()) return W0("Another process is currently installing an update"), 
    B0("tengu_auto_updater_lock_contention", {
        pid: String(process.pid),
        currentVersion: {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.VERSION
    }), "in_progress";
    try {
        let {
            hasPermissions: I
        } = await oU1();
        if (!I) return "no_permissions";
        let G = P2.isRunningWithBun() ? "bun" : "npm", Z = await O3(G, [ "install", "-g", {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.PACKAGE_URL ]);
        if (Z.code !== 0) return W0(`Failed to install new version of claude: ${Z.stdout} ${Z.stderr}`), 
        "install_failed";
        return "success";
    } finally {
        bf3();
    }
}

var QT = A1(u1(), 1);

function JJ() {
    return QT.createElement(O, {
        color: e1().permission
    }, "Press ", QT.createElement(O, {
        bold: !0
    }, "Enter"), " to continue…");
}

function NT({
    onDone: I,
    doctorMode: G = !1
}) {
    let [ Z, d ] = W3.useState(null), [ W, B ] = W3.useState(null), w = e1(), V = z6(() => process.exit(0)), C = W3.useCallback(async () => {
        let X = await oU1();
        if (B0("tengu_auto_updater_permissions_check", {
            hasPermissions: X.hasPermissions.toString(),
            npmPrefix: X.npmPrefix ?? "null"
        }), d(X.hasPermissions), X.npmPrefix) B(X.npmPrefix);
        if (X.hasPermissions) {
            let Y = Q2();
            if (i4({
                ...Y,
                autoUpdaterStatus: "enabled"
            }), !G) I();
        }
    }, [ I, G ]);
    if (W3.useEffect(() => {
        B0("tengu_auto_updater_config_start", {}), C();
    }, [ C ]), _4((X, Y) => {
        if (Y.return) I();
    }), Z === null) return W3.default.createElement(p, {
        paddingX: 1,
        paddingTop: 1
    }, W3.default.createElement(O, {
        color: w.secondaryText
    }, "Checking npm permissions…"));
    if (Z === !0) {
        if (G) return W3.default.createElement(p, {
            flexDirection: "column",
            gap: 1,
            paddingX: 1,
            paddingTop: 1
        }, W3.default.createElement(O, {
            color: w.success
        }, "✓ npm permissions: OK"), W3.default.createElement(O, null, "Your installation is healthy and ready for auto-updates."), W3.default.createElement(JJ, null));
        return W3.default.createElement(p, {
            paddingX: 1,
            paddingTop: 1
        }, W3.default.createElement(O, {
            color: w.success
        }, "✓ Auto-updates enabled"));
    }
    return W3.default.createElement(W3.default.Fragment, null, W3.default.createElement(p, {
        borderColor: w.permission,
        borderStyle: "round",
        flexDirection: "column",
        gap: 1,
        paddingX: 1,
        paddingTop: 1
    }, W3.default.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, W3.default.createElement(O, {
        bold: !0,
        color: w.permission
    }, "Enable automatic updates?"), W3.default.createElement(O, null, b2, " can't update itself because it doesn't have sufficient permissions."), W3.default.createElement(O, null, "Please visit our", " ", W3.default.createElement(of, {
        url: "https://docs.anthropic.com/s/claude-code-auto-updater"
    }, W3.default.createElement(O, {
        color: w.warning
    }, "troubleshooting guide")), " ", "to resolve resolve permission issues and get the latest features and improvements")), W3.default.createElement(JJ, null), W && W3.default.createElement(p, null, W3.default.createElement(O, {
        color: w.secondaryText
    }, "Current npm prefix: ", W))), W3.default.createElement(p, {
        marginLeft: 1,
        height: Z === !1 ? 1 : void 0
    }, W3.default.createElement(O, {
        dimColor: !0
    }, V.pending ? W3.default.createElement(W3.default.Fragment, null, "Press ", V.keyName, " again to exit") : null)));
}

var lf3 = {
    name: "doctor",
    description: "Checks the health of your Claude Code installation",
    isEnabled: !0,
    isHidden: !1,
    userFacingName() {
        return "doctor";
    },
    type: "local-jsx",
    call(I) {
        let G = PL2.default.createElement(NT, {
            onDone: I,
            doctorMode: !0
        });
        return Promise.resolve(G);
    }
}, uL2 = lf3;

import {
    join as kf3
} from "path";

var r16 = kf3(_w, "CLAUDE.md");

var K2 = A1(u1(), 1);

function yL2({
    commands: I,
    onClose: G
}) {
    let Z = e1(), d = !1, W = `Learn more at: ${{
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.README_URL}`, B = I.filter(C => !C.isHidden), [ w, V ] = K2.useState(0);
    return K2.useEffect(() => {
        let C = setTimeout(() => {
            if (w < 3) V(w + 1);
        }, 250);
        return () => clearTimeout(C);
    }, [ w ]), _4((C, X) => {
        if (X.return) G();
    }), K2.createElement(p, {
        flexDirection: "column",
        padding: 1
    }, K2.createElement(O, {
        bold: !0,
        color: Z.claude
    }, `${b2} v${{
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.VERSION}`), K2.createElement(p, {
        marginTop: 1,
        flexDirection: "column"
    }, K2.createElement(O, null, b2, " is a beta research preview. Always review Claude's responses, especially when running code. Claude has read access to files in the current directory and can run commands and edit files with your permission.")), w >= 1 && K2.createElement(p, {
        flexDirection: "column",
        marginTop: 1
    }, K2.createElement(O, {
        bold: !0
    }, "Usage Modes:"), K2.createElement(O, null, "• REPL: ", K2.createElement(O, {
        bold: !0
    }, "claude"), " (interactive session)"), K2.createElement(O, null, "• Non-interactive: ", K2.createElement(O, {
        bold: !0
    }, 'claude -p "question"')), K2.createElement(p, {
        marginTop: 1
    }, K2.createElement(O, null, "Run ", K2.createElement(O, {
        bold: !0
    }, "claude -h"), " for all command line options"))), w >= 2 && K2.createElement(p, {
        marginTop: 1,
        flexDirection: "column"
    }, K2.createElement(O, {
        bold: !0
    }, "Common Tasks:"), K2.createElement(O, null, "• Ask questions about your codebase", " ", K2.createElement(O, {
        color: e1().secondaryText
    }, "> How does foo.py work?")), K2.createElement(O, null, "• Edit files", " ", K2.createElement(O, {
        color: e1().secondaryText
    }, "> Update bar.ts to...")), K2.createElement(O, null, "• Fix errors", " ", K2.createElement(O, {
        color: e1().secondaryText
    }, "> cargo build")), K2.createElement(O, null, "• Run commands", " ", K2.createElement(O, {
        color: e1().secondaryText
    }, "> /help")), K2.createElement(O, null, "• Run bash commands", " ", K2.createElement(O, {
        color: e1().secondaryText
    }, "> !ls"))), w >= 3 && K2.createElement(p, {
        marginTop: 1,
        flexDirection: "column"
    }, K2.createElement(O, {
        bold: !0
    }, "Interactive Mode Commands:"), K2.createElement(p, {
        flexDirection: "column"
    }, B.map((C, X) => K2.createElement(p, {
        key: X,
        marginLeft: 1
    }, K2.createElement(O, {
        bold: !0
    }, `/${C.name}`), K2.createElement(O, null, " - ", C.description))))), K2.createElement(p, {
        marginTop: 1
    }, K2.createElement(O, {
        color: Z.secondaryText
    }, W)), K2.createElement(p, {
        marginTop: 2
    }, K2.createElement(JJ, null)));
}

var eU1 = A1(u1(), 1), xf3 = {
    type: "local-jsx",
    name: "help",
    description: "Show help and available commands",
    isEnabled: !0,
    isHidden: !1,
    async call(I, {
        options: {
            commands: G
        }
    }) {
        return eU1.createElement(yL2, {
            commands: G,
            onClose: I
        });
    },
    userFacingName() {
        return "help";
    }
}, OL2 = xf3;

var hf3 = {
    type: "prompt",
    name: "init",
    description: "Initialize a new CLAUDE.md file with codebase documentation",
    isEnabled: !0,
    isHidden: !1,
    progressMessage: "analyzing your codebase",
    userFacingName() {
        return "init";
    },
    async getPromptForCommand(I) {
        return If(), [ {
            role: "user",
            content: [ {
                type: "text",
                text: `Please analyze this codebase and create a CLAUDE.md file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long.
If there's already a CLAUDE.md, improve it.
If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.`
            } ]
        } ];
    }
}, mL2 = hf3;

var C06 = process.platform === "darwin" && [ "iTerm.app", "Apple_Terminal" ].includes(process.env.TERM_PROGRAM || "");

var zG = A1(u1(), 1);

var t2 = A1(u1(), 1);

import * as tU1 from "crypto";

import {
    webcrypto as if3
} from "node:crypto";

import * as TL2 from "http";

import * as bL2 from "url";

var cf3 = {
    REDIRECT_PORT: 54545,
    MANUAL_REDIRECT_URL: "/oauth/code/callback",
    SCOPES: [ "org:create_api_key", "user:profile" ]
}, pf3 = {
    ...cf3,
    AUTHORIZE_URL: "https://console.anthropic.com/oauth/authorize",
    TOKEN_URL: "https://console.anthropic.com/v1/oauth/token",
    API_KEY_URL: "https://api.anthropic.com/api/oauth/claude_cli/create_api_key",
    SUCCESS_URL: "https://console.anthropic.com/buy_credits?returnUrl=/oauth/code/success",
    CLIENT_ID: "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
};

var dd = pf3;

var {
    subtle: nf3
} = if3;

function If1(I) {
    return I.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function af3() {
    return If1(tU1.randomBytes(32));
}

async function rf3(I) {
    let Z = new TextEncoder().encode(I), d = await nf3.digest("SHA-256", Z);
    return If1(Buffer.from(d));
}

class Gf1 {
    server = null;
    codeVerifier;
    expectedState = null;
    pendingCodePromise = null;
    constructor() {
        this.codeVerifier = af3();
    }
    generateAuthUrls(I, G) {
        function Z(d) {
            let W = new URL(dd.AUTHORIZE_URL);
            return W.searchParams.append("client_id", dd.CLIENT_ID), W.searchParams.append("response_type", "code"), 
            W.searchParams.append("redirect_uri", d ? dd.MANUAL_REDIRECT_URL : `http://localhost:${dd.REDIRECT_PORT}/callback`), 
            W.searchParams.append("scope", dd.SCOPES.join(" ")), W.searchParams.append("code_challenge", I), 
            W.searchParams.append("code_challenge_method", "S256"), W.searchParams.append("state", G), 
            W.toString();
        }
        return {
            autoUrl: Z(!1),
            manualUrl: Z(!0)
        };
    }
    async startOAuthFlow(I) {
        let G = await rf3(this.codeVerifier), Z = If1(tU1.randomBytes(32));
        this.expectedState = Z;
        let {
            autoUrl: d,
            manualUrl: W
        } = this.generateAuthUrls(G, Z), B = async () => {
            await I(W), await l11(d);
        }, {
            authorizationCode: w,
            useManualRedirect: V
        } = await new Promise((A, D) => {
            this.pendingCodePromise = {
                resolve: A,
                reject: D
            }, this.startLocalServer(Z, B);
        }), {
            access_token: C,
            account: X,
            organization: Y
        } = await this.exchangeCodeForTokens(w, Z, V);
        if (X) {
            let A = {
                accountUuid: X.uuid,
                emailAddress: X.email_address,
                organizationUuid: Y?.uuid
            }, D = Q2();
            D.oauthAccount = A, i4(D);
        }
        return {
            accessToken: C
        };
    }
    startLocalServer(I, G) {
        if (this.server) this.closeServer();
        this.server = TL2.createServer((Z, d) => {
            let W = bL2.parse(Z.url || "", !0);
            if (W.pathname === "/callback") {
                let B = W.query.code, w = W.query.state;
                if (!B) {
                    if (d.writeHead(400), d.end("Authorization code not found"), 
                    this.pendingCodePromise) this.pendingCodePromise.reject(new Error("No authorization code received"));
                    return;
                }
                if (w !== I) {
                    if (d.writeHead(400), d.end("Invalid state parameter"), this.pendingCodePromise) this.pendingCodePromise.reject(new Error("Invalid state parameter"));
                    return;
                }
                d.writeHead(302, {
                    Location: dd.SUCCESS_URL
                }), d.end(), B0("tengu_oauth_automatic_redirect", {}), this.processCallback({
                    authorizationCode: B,
                    state: I,
                    useManualRedirect: !1
                });
            } else d.writeHead(404), d.end();
        }), this.server.listen(dd.REDIRECT_PORT, async () => {
            G?.();
        }), this.server.on("error", Z => {
            if (Z.code === "EADDRINUSE") {
                let W = new Error(`Port ${dd.REDIRECT_PORT} is already in use. Please ensure no other applications are using this port.`);
                if (W0(W), this.closeServer(), this.pendingCodePromise) this.pendingCodePromise.reject(W);
                return;
            } else {
                if (W0(Z), this.closeServer(), this.pendingCodePromise) this.pendingCodePromise.reject(Z);
                return;
            }
        });
    }
    async exchangeCodeForTokens(I, G, Z = !1) {
        let d = {
            grant_type: "authorization_code",
            code: I,
            redirect_uri: Z ? dd.MANUAL_REDIRECT_URL : `http://localhost:${dd.REDIRECT_PORT}/callback`,
            client_id: dd.CLIENT_ID,
            code_verifier: this.codeVerifier,
            state: G
        }, W = await fC.post(dd.TOKEN_URL, d, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (W.status !== 200) throw new Error(`Token exchange failed: ${W.statusText}`);
        return W.data;
    }
    processCallback({
        authorizationCode: I,
        state: G,
        useManualRedirect: Z
    }) {
        if (this.closeServer(), G !== this.expectedState) {
            if (this.pendingCodePromise) this.pendingCodePromise.reject(new Error("Invalid state parameter")), 
            this.pendingCodePromise = null;
            return;
        }
        if (this.pendingCodePromise) this.pendingCodePromise.resolve({
            authorizationCode: I,
            useManualRedirect: Z
        }), this.pendingCodePromise = null;
    }
    closeServer() {
        if (this.server) this.server.close(), this.server = null;
    }
}

async function jL2(I) {
    try {
        let G = await fetch(dd.API_KEY_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${I}`
            }
        }), Z, d = "";
        try {
            Z = await G.json();
        } catch (W) {
            d = await G.text();
        }
        if (B0("tengu_oauth_api_key", {
            status: G.ok ? "success" : "failure",
            statusCode: G.status.toString(),
            error: G.ok ? "" : d || JSON.stringify(Z)
        }), G.ok && Z && Z.raw_key) {
            let W = Z.raw_key;
            return _W0(W), H$2(), W;
        }
        return null;
    } catch (G) {
        throw B0("tengu_oauth_api_key", {
            status: "failure",
            statusCode: "exception",
            error: G instanceof Error ? G.message : String(G)
        }), G;
    }
}

var Zf1 = A1(u1(), 1);

function lL2() {
    let I = e1();
    return Zf1.default.createElement(p, {
        flexDirection: "column",
        alignItems: "flex-start"
    }, Zf1.default.createElement(O, {
        color: I.claude
    }, ` ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗  
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
 ██████╗ ██████╗ ██████╗ ███████╗                
██╔════╝██╔═══██╗██╔══██╗██╔════╝                
██║     ██║   ██║██║  ██║█████╗                  
██║     ██║   ██║██║  ██║██╔══╝                  
╚██████╗╚██████╔╝██████╔╝███████╗                
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`));
}

var RI = A1(u1(), 1), zV = A1(u1(), 1);

var o11 = process.platform === "darwin" ? [ "·", "✢", "✳", "∗", "✻", "✽" ] : [ "·", "✢", "*", "∗", "✻", "✽" ], sf3 = [ "Accomplishing", "Actioning", "Actualizing", "Baking", "Brewing", "Calculating", "Cerebrating", "Churning", "Clauding", "Coalescing", "Cogitating", "Computing", "Conjuring", "Considering", "Cooking", "Crafting", "Creating", "Crunching", "Deliberating", "Determining", "Doing", "Effecting", "Finagling", "Forging", "Forming", "Generating", "Hatching", "Herding", "Honking", "Hustling", "Ideating", "Inferring", "Manifesting", "Marinating", "Moseying", "Mulling", "Mustering", "Musing", "Noodling", "Percolating", "Pondering", "Processing", "Puttering", "Reticulating", "Ruminating", "Schlepping", "Shucking", "Simmering", "Smooshing", "Spinning", "Stewing", "Synthesizing", "Thinking", "Transmuting", "Vibing", "Working" ];

function e11() {
    let I = [ ...o11, ...[ ...o11 ].reverse() ], [ G, Z ] = zV.useState(0), [ d, W ] = zV.useState(0), B = zV.useRef(cK(sf3)), w = zV.useRef(Date.now());
    return zV.useEffect(() => {
        let V = setInterval(() => {
            Z(C => (C + 1) % I.length);
        }, 120);
        return () => clearInterval(V);
    }, [ I.length ]), zV.useEffect(() => {
        let V = setInterval(() => {
            W(Math.floor((Date.now() - w.current) / 1e3));
        }, 1e3);
        return () => clearInterval(V);
    }, []), RI.createElement(p, {
        flexDirection: "row",
        marginTop: 1
    }, RI.createElement(p, {
        flexWrap: "nowrap",
        height: 1,
        width: 2
    }, RI.createElement(O, {
        color: e1().claude
    }, I[G])), RI.createElement(O, {
        color: e1().claude
    }, B.current, "… "), RI.createElement(O, {
        color: e1().secondaryText
    }, "(", d, "s · ", RI.createElement(O, {
        bold: !0
    }, "esc"), " to interrupt)"));
}

function UN() {
    let I = [ ...o11, ...[ ...o11 ].reverse() ], [ G, Z ] = zV.useState(0);
    return zV.useEffect(() => {
        let d = setInterval(() => {
            Z(W => (W + 1) % I.length);
        }, 120);
        return () => clearInterval(d);
    }, [ I.length ]), RI.createElement(p, {
        flexWrap: "nowrap",
        height: 1,
        width: 2
    }, RI.createElement(O, {
        color: e1().claude
    }, I[G]));
}

var N2 = A1(u1(), 1);

var KG = A1(u1(), 1);

function kL2({
    customApiKeyTruncated: I,
    onDone: G
}) {
    let Z = e1();
    function d(B) {
        let w = Q2();
        switch (B) {
          case "yes":
            {
                i4({
                    ...w,
                    customApiKeyResponses: {
                        ...w.customApiKeyResponses,
                        approved: [ ...w.customApiKeyResponses?.approved ?? [], I ]
                    }
                }), G();
                break;
            }

          case "no":
            {
                i4({
                    ...w,
                    customApiKeyResponses: {
                        ...w.customApiKeyResponses,
                        rejected: [ ...w.customApiKeyResponses?.rejected ?? [], I ]
                    }
                }), G();
                break;
            }
        }
    }
    let W = z6(() => process.exit(0));
    return KG.default.createElement(KG.default.Fragment, null, KG.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        padding: 1,
        borderStyle: "round",
        borderColor: Z.warning
    }, KG.default.createElement(O, {
        bold: !0,
        color: Z.warning
    }, "Detected a custom API key in your environment"), KG.default.createElement(O, null, "Your environment sets", " ", KG.default.createElement(O, {
        color: Z.warning
    }, "ANTHROPIC_API_KEY"), ":", " ", KG.default.createElement(O, {
        bold: !0
    }, "sk-ant-...", I)), KG.default.createElement(O, null, "Do you want to use this API key?"), KG.default.createElement(f7, {
        options: [ {
            label: `No (${T0.bold("recommended")})`,
            value: "no"
        }, {
            label: "Yes",
            value: "yes"
        } ],
        onChange: B => d(B)
    })), KG.default.createElement(p, {
        marginLeft: 3
    }, KG.default.createElement(O, {
        dimColor: !0
    }, W.pending ? KG.default.createElement(KG.default.Fragment, null, "Press ", W.keyName, " again to exit") : KG.default.createElement(KG.default.Fragment, null, "Enter to confirm"))));
}

var O7 = A1(u1(), 1);

var t11 = A1(u1(), 1);

function xL2(I) {
    let [ G, Z ] = t11.useState(!1);
    return t11.useEffect(() => {
        let d = setTimeout(() => {
            Z(!0);
        }, I);
        return () => clearTimeout(d);
    }, [ I ]), G;
}

async function of3() {
    try {
        let I = [ "https://api.anthropic.com/api/hello", "https://console.anthropic.com/v1/oauth/hello" ], G = async W => {
            try {
                let B = await fC.get(W, {
                    headers: {
                        "User-Agent": lv
                    }
                });
                if (B.status !== 200) return {
                    success: !1,
                    error: `Failed to connect to ${new URL(W).hostname}: Status ${B.status}`
                };
                return {
                    success: !0
                };
            } catch (B) {
                return {
                    success: !1,
                    error: `Failed to connect to ${new URL(W).hostname}: ${B instanceof Error ? B.message : String(B)}`
                };
            }
        };
        return (await Promise.all(I.map(G))).find(W => !W.success) || {
            success: !0
        };
    } catch (I) {
        return W0(I), {
            success: !1,
            error: `Connectivity check error: ${I instanceof Error ? I.message : String(I)}`
        };
    }
}

function hL2({
    onSuccess: I
}) {
    let [ G, Z ] = O7.useState(null), [ d, W ] = O7.useState(!0), B = e1(), w = xL2(1e3) && d;
    return O7.useEffect(() => {
        async function V() {
            let C = await of3();
            Z(C), W(!1);
        }
        V();
    }, []), O7.useEffect(() => {
        if (G?.success) I(); else if (G && !G.success) {
            let V = setTimeout(() => process.exit(1), 100);
            return () => clearTimeout(V);
        }
    }, [ G, I ]), O7.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, d && w ? O7.default.createElement(p, {
        paddingLeft: 1
    }, O7.default.createElement(UN, null), O7.default.createElement(O, null, "Checking connectivity...")) : !G?.success && !d && O7.default.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, O7.default.createElement(O, {
        color: B.error
    }, "Unable to connect to Anthropic services"), O7.default.createElement(O, {
        color: B.error
    }, G?.error), O7.default.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, O7.default.createElement(O, null, "Please check your internet connection and network settings."), O7.default.createElement(O, null, "Note: ", b2, " might not be available in your country. Check supported countries at", " ", O7.default.createElement(O, {
        color: B.suggestion
    }, "https://anthropic.com/supported-countries")))));
}

function df1({
    onDone: I
}) {
    let [ G, Z ] = N2.useState(0), d = Q2(), W = _n(), [ B, w ] = N2.useState(Dw.theme), V = e1();
    function C() {
        if (G < U.length - 1) {
            let M = G + 1;
            Z(M);
        }
    }
    function X(M) {
        i4({
            ...d,
            theme: M
        }), C();
    }
    let Y = z6(() => process.exit(0));
    _4(async (M, S) => {
        let L = U[G];
        if (S.return && L && [ "usage", "security" ].includes(L.id)) if (G === U.length - 1) I(); else {
            if (L.id === "security") await w8();
            C();
        }
    });
    let D = N2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, N2.default.createElement(O, null, "Let's get started."), N2.default.createElement(p, {
        flexDirection: "column"
    }, N2.default.createElement(O, {
        bold: !0
    }, "Choose the text style that looks best with your terminal:"), N2.default.createElement(O, {
        dimColor: !0
    }, "To change this later, run /config")), N2.default.createElement(tI, {
        options: [ {
            label: "Light text",
            value: "dark"
        }, {
            label: "Dark text",
            value: "light"
        }, {
            label: "Light text (colorblind-friendly)",
            value: "dark-daltonized"
        }, {
            label: "Dark text (colorblind-friendly)",
            value: "light-daltonized"
        }, {
            label: "Light text (ANSI colors only)",
            value: "dark-ansi"
        }, {
            label: "Dark text (ANSI colors only)",
            value: "light-ansi"
        } ],
        onFocus: M => w(M),
        onChange: X,
        visibleOptionCount: 6
    }), N2.default.createElement(p, {
        flexDirection: "column",
        paddingTop: 1
    }, N2.default.createElement(O, {
        bold: !0
    }, "Preview"), N2.default.createElement(p, {
        paddingLeft: 1,
        marginRight: 1,
        borderStyle: "round",
        flexDirection: "column"
    }, N2.default.createElement(EB, {
        patch: {
            oldStart: 1,
            newStart: 1,
            oldLines: 3,
            newLines: 3,
            lines: [ "function greet() {", '-  console.log("Hello, World!");', '+  console.log("Hello, Claude!");', "}" ]
        },
        dim: !1,
        width: 40,
        overrideTheme: B
    })))), J = N2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, N2.default.createElement(O, {
        bold: !0
    }, "Security notes:"), N2.default.createElement(p, {
        flexDirection: "column",
        width: 70
    }, N2.default.createElement(GI, null, N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Claude Code is currently in research preview"), N2.default.createElement(O, {
        color: V.secondaryText,
        wrap: "wrap"
    }, "This beta version may have limitations or unexpected behaviors.", N2.default.createElement(R5, null), "Run /bug at any time to report issues.", N2.default.createElement(R5, null))), N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Claude can make mistakes"), N2.default.createElement(O, {
        color: V.secondaryText,
        wrap: "wrap"
    }, "You should always review Claude's responses, especially when", N2.default.createElement(R5, null), "running code.", N2.default.createElement(R5, null))), N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Due to prompt injection risks, only use it with code you trust"), N2.default.createElement(O, {
        color: V.secondaryText,
        wrap: "wrap"
    }, "For more details see:", N2.default.createElement(R5, null), N2.default.createElement(iC, {
        url: "https://docs.anthropic.com/s/claude-code-security"
    }))))), N2.default.createElement(JJ, null)), K = N2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, N2.default.createElement(O, {
        bold: !0
    }, "Using ", b2, " effectively:"), N2.default.createElement(p, {
        flexDirection: "column",
        width: 70
    }, N2.default.createElement(GI, null, N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Start in your project directory", N2.default.createElement(R5, null), N2.default.createElement(O, {
        color: V.secondaryText
    }, "Files are automatically added to context when needed."), N2.default.createElement(R5, null))), N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Use ", b2, " as a development partner", N2.default.createElement(R5, null), N2.default.createElement(O, {
        color: V.secondaryText
    }, "Get help with file analysis, editing, bash commands,", N2.default.createElement(R5, null), "and git history.", N2.default.createElement(R5, null)))), N2.default.createElement(GI.Item, null, N2.default.createElement(O, null, "Provide clear context", N2.default.createElement(R5, null), N2.default.createElement(O, {
        color: V.secondaryText
    }, "Be as specific as you would with another engineer. ", N2.default.createElement(R5, null), "The better the context, the better the results. ", N2.default.createElement(R5, null))))), N2.default.createElement(p, null, N2.default.createElement(O, null, "For more details on ", b2, ", see:", N2.default.createElement(R5, null), N2.default.createElement(iC, {
        url: {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.README_URL
    })))), N2.default.createElement(JJ, null)), z = N2.default.createElement(hL2, {
        onSuccess: C
    }), Q = N2.useMemo(() => {
        return "";
    }, []), U = [];
    if (W) U.push({
        id: "preflight",
        component: z
    });
    if (U.push({
        id: "theme",
        component: D
    }), W) U.push({
        id: "oauth",
        component: N2.default.createElement(I01, {
            onDone: C
        })
    });
    if (Q) U.push({
        id: "api-key",
        component: N2.default.createElement(kL2, {
            customApiKeyTruncated: Q,
            onDone: C
        })
    });
    return U.push({
        id: "security",
        component: J
    }), U.push({
        id: "usage",
        component: K
    }), N2.default.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, U[G]?.id !== "oauth" && N2.default.createElement(Wf1, null), N2.default.createElement(p, {
        flexDirection: "column",
        padding: 0,
        gap: 0
    }, U[G]?.component, Y.pending && N2.default.createElement(p, {
        padding: 1
    }, N2.default.createElement(O, {
        dimColor: !0
    }, "Press ", Y.keyName, " again to exit"))));
}

function Wf1() {
    let I = e1();
    return N2.default.createElement(p, {
        borderColor: I.claude,
        borderStyle: "round",
        paddingX: 1,
        width: kW1
    }, N2.default.createElement(O, null, N2.default.createElement(O, {
        color: I.claude
    }, "✻"), " Welcome to", " ", N2.default.createElement(O, {
        bold: !0
    }, b2), " research preview!"));
}

function cL2({
    message: I,
    title: G
}) {
    let Z = G ? `${G}:
${I}` : I;
    try {
        process.stdout.write(`\x1B]9;

${Z}\x07`);
    } catch {}
}

function pL2() {
    process.stdout.write("");
}

async function G01(I) {
    switch (Q2().preferredNotifChannel) {
      case "iterm2":
        cL2(I);
        break;

      case "terminal_bell":
        pL2();
        break;

      case "iterm2_with_bell":
        cL2(I), pL2();
        break;

      case "notifications_disabled":
        break;
    }
}

var iL2 = "Paste code here if prompted > ";

function I01({
    onDone: I
}) {
    let [ G, Z ] = t2.useState({
        state: "idle"
    }), d = e1(), [ W, B ] = t2.useState(""), [ w, V ] = t2.useState(0), [ C ] = t2.useState(() => new Gf1()), [ X, Y ] = t2.useState(!1), [ A, D ] = t2.useState(!1), J = Q5().columns - iL2.length - 1;
    t2.useEffect(() => {
        if (A) w8(), D(!1);
    }, [ A ]), t2.useEffect(() => {
        if (G.state === "about_to_retry") D(!0), setTimeout(() => {
            Z(G.nextState);
        }, 1e3);
    }, [ G ]), _4(async (M, S) => {
        if (S.return) {
            if (G.state === "idle") B0("tengu_oauth_start", {}), Z({
                state: "ready_to_start"
            }); else if (G.state === "success") B0("tengu_oauth_success", {}), await w8(), 
            I(); else if (G.state === "error" && G.toRetry) B(""), Z({
                state: "about_to_retry",
                nextState: G.toRetry
            });
        }
    });
    async function K(M, S) {
        try {
            let [ L, P ] = M.split("#");
            if (!L || !P) {
                Z({
                    state: "error",
                    message: "Invalid code. Please make sure the full code was copied",
                    toRetry: {
                        state: "waiting_for_login",
                        url: S
                    }
                });
                return;
            }
            B0("tengu_oauth_manual_entry", {}), C.processCallback({
                authorizationCode: L,
                state: P,
                useManualRedirect: !0
            });
        } catch (L) {
            W0(L), Z({
                state: "error",
                message: L.message,
                toRetry: {
                    state: "waiting_for_login",
                    url: S
                }
            });
        }
    }
    let z = t2.useCallback(async () => {
        try {
            let M = await C.startOAuthFlow(async L => {
                Z({
                    state: "waiting_for_login",
                    url: L
                }), setTimeout(() => Y(!0), 3e3);
            }).catch(L => {
                if (L.message.includes("Token exchange failed")) Z({
                    state: "error",
                    message: "Failed to exchange authorization code for access token. Please try again.",
                    toRetry: {
                        state: "ready_to_start"
                    }
                }), B0("tengu_oauth_token_exchange_error", {
                    error: L.message
                }); else Z({
                    state: "error",
                    message: L.message,
                    toRetry: {
                        state: "ready_to_start"
                    }
                });
                throw L;
            });
            Z({
                state: "creating_api_key"
            });
            let S = await jL2(M.accessToken).catch(L => {
                throw Z({
                    state: "error",
                    message: "Failed to create API key: " + L.message,
                    toRetry: {
                        state: "ready_to_start"
                    }
                }), B0("tengu_oauth_api_key_error", {
                    error: L.message
                }), L;
            });
            if (S) Z({
                state: "success",
                apiKey: S
            }), G01({
                message: "Claude Code login successful"
            }); else Z({
                state: "error",
                message: "Unable to create API key. The server accepted the request but didn't return a key.",
                toRetry: {
                    state: "ready_to_start"
                }
            }), B0("tengu_oauth_api_key_error", {
                error: "server_returned_no_key"
            });
        } catch (M) {
            let S = M.message;
            B0("tengu_oauth_error", {
                error: S
            });
        }
    }, [ C, Y ]);
    t2.useEffect(() => {
        if (G.state === "ready_to_start") z();
    }, [ G.state, z ]);
    function Q() {
        switch (G.state) {
          case "idle":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 1
            }, t2.default.createElement(O, {
                bold: !0
            }, b2, " is billed based on API usage through your Anthropic Console account."), t2.default.createElement(p, null, t2.default.createElement(O, null, "Pricing may evolve as we move towards general availability.")), t2.default.createElement(p, {
                marginTop: 1
            }, t2.default.createElement(O, {
                color: d.permission
            }, "Press ", t2.default.createElement(O, {
                bold: !0
            }, "Enter"), " to login to your Anthropic Console account…")));

          case "waiting_for_login":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 1
            }, !X && t2.default.createElement(p, null, t2.default.createElement(UN, null), t2.default.createElement(O, null, "Opening browser to sign in…")), X && t2.default.createElement(p, null, t2.default.createElement(O, null, iL2), t2.default.createElement(MB, {
                value: W,
                onChange: B,
                onSubmit: M => K(M, G.url),
                cursorOffset: w,
                onChangeCursorOffset: V,
                columns: J
            })));

          case "creating_api_key":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 1
            }, t2.default.createElement(p, null, t2.default.createElement(UN, null), t2.default.createElement(O, null, "Creating API key for Claude Code…")));

          case "about_to_retry":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 1
            }, t2.default.createElement(O, {
                color: d.permission
            }, "Retrying…"));

          case "success":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 2
            }, Q2().oauthAccount?.emailAddress ? t2.default.createElement(O, {
                dimColor: !0
            }, "Logged in as", " ", t2.default.createElement(O, null, Q2().oauthAccount?.emailAddress)) : null, t2.default.createElement(O, {
                color: d.success
            }, "Login successful. Press ", t2.default.createElement(O, {
                bold: !0
            }, "Enter"), " to continue…"));

          case "error":
            return t2.default.createElement(p, {
                flexDirection: "column",
                gap: 1
            }, t2.default.createElement(O, {
                color: d.error
            }, "OAuth error: ", G.message), G.toRetry && t2.default.createElement(p, {
                marginTop: 1
            }, t2.default.createElement(O, {
                color: d.permission
            }, "Press ", t2.default.createElement(O, {
                bold: !0
            }, "Enter"), " to retry.")));

          default:
            return null;
        }
    }
    let U = {};
    if (!A) U.header = t2.default.createElement(p, {
        key: "header",
        flexDirection: "column",
        gap: 1
    }, t2.default.createElement(Wf1, null), t2.default.createElement(p, {
        paddingBottom: 1,
        paddingLeft: 1
    }, t2.default.createElement(lL2, null)));
    if (G.state === "waiting_for_login" && X) U.urlToCopy = t2.default.createElement(p, {
        flexDirection: "column",
        key: "urlToCopy",
        gap: 1,
        paddingBottom: 1
    }, t2.default.createElement(p, {
        paddingX: 1
    }, t2.default.createElement(O, {
        dimColor: !0
    }, "Browser didn't open? Use the url below to sign in:")), t2.default.createElement(p, {
        width: 1e3
    }, t2.default.createElement(O, {
        dimColor: !0
    }, G.url)));
    return t2.default.createElement(p, {
        flexDirection: "column",
        gap: 1
    }, t2.default.createElement(nU, {
        items: Object.keys(U)
    }, M => U[M]), t2.default.createElement(p, {
        paddingLeft: 1,
        flexDirection: "column",
        gap: 1
    }, Q()));
}

var nL2 = () => ({
    type: "local-jsx",
    name: "login",
    description: Lw() ? "Switch Anthropic accounts" : "Sign in with your Anthropic account",
    isEnabled: !0,
    isHidden: !1,
    async call(I, G) {
        return await w8(), zG.createElement(ef3, {
            onDone: async () => {
                x11(G), I();
            }
        });
    },
    userFacingName() {
        return "login";
    }
});

function ef3(I) {
    let G = z6(I.onDone);
    return zG.createElement(p, {
        flexDirection: "column"
    }, zG.createElement(I01, {
        onDone: I.onDone
    }), zG.createElement(p, {
        marginLeft: 3
    }, zG.createElement(O, {
        dimColor: !0
    }, G.pending ? zG.createElement(zG.Fragment, null, "Press ", G.keyName, " again to exit") : "")));
}

var Bf1 = A1(u1(), 1);

var aL2 = {
    type: "local-jsx",
    name: "logout",
    description: "Sign out from your Anthropic account",
    isEnabled: !0,
    isHidden: !1,
    async call() {
        await w8(), HW0();
        let I = Q2();
        if (I.oauthAccount = void 0, I.hasCompletedOnboarding = !1, I.customApiKeyResponses?.approved) I.customApiKeyResponses.approved = [];
        i4(I);
        let G = Bf1.createElement(O, null, "Successfully logged out from your Anthropic account.");
        return setTimeout(() => {
            process.exit(0);
        }, 200), G;
    },
    userFacingName() {
        return "logout";
    }
};

var tf3 = A1(u1(), 1);

var rL2 = {
    type: "prompt",
    name: "pr-comments",
    description: "Get comments from a GitHub pull request",
    progressMessage: "fetching PR comments",
    isEnabled: !0,
    isHidden: !1,
    userFacingName() {
        return "pr-comments";
    },
    async getPromptForCommand(I) {
        return [ {
            role: "user",
            content: [ {
                type: "text",
                text: `You are an AI assistant integrated into a git-based version control system. Your task is to fetch and display comments from a GitHub pull request.

Follow these steps:

1. Use \`gh pr view --json number,headRepository\` to get the PR number and repository info
2. Use \`gh api /repos/{owner}/{repo}/issues/{number}/comments\` to get PR-level comments
3. Use \`gh api /repos/{owner}/{repo}/pulls/{number}/comments\` to get review comments. Pay particular attention to the following fields: \`body\`, \`diff_hunk\`, \`path\`, \`line\`, etc. If the comment references some code, consider fetching it using eg \`gh api /repos/{owner}/{repo}/contents/{path}?ref={branch} | jq .content -r | base64 -d\`
4. Parse and format all comments in a readable way
5. Return ONLY the formatted comments, with no additional text

Format the comments as:

## Comments

[For each comment thread:]
- @author file.ts#line:
  \`\`\`diff
  [diff_hunk from the API response]
  \`\`\`
  > quoted comment text
  
  [any replies indented]

If there are no comments, return "No comments found."

Remember:
1. Only show the actual comments, no explanatory text
2. Include both PR-level and code review comments
3. Preserve the threading/nesting of comment replies
4. Show the file and line number context for code review comments
5. Use jq to parse the JSON responses from the GitHub API

${I ? "Additional user input: " + I : ""}
`
            } ]
        } ];
    }
};

var sL2 = A1(VP(), 1);

var IR3 = {
    description: "Show release notes for the current or specified version",
    isEnabled: !1,
    isHidden: !1,
    name: "release-notes",
    userFacingName() {
        return "release-notes";
    },
    type: "local",
    async call(I) {
        let G = {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.VERSION, Z = I ? I.trim() : G, d = sL2.coerce(Z);
        if (!d) return `Invalid version: ${Z}`;
        let W = Vi[d.toString()];
        if (!W || W.length === 0) return `No release notes available for version ${d}.`;
        let B = `Release notes for version ${d}:`, w = W.map(V => `• ${V}`).join(`
`);
        return `${B}

${w}`;
    }
}, oL2 = IR3;

var Z01 = {
    type: "prompt",
    name: "review",
    description: "Review a pull request",
    isEnabled: !0,
    isHidden: !1,
    progressMessage: "reviewing pull request",
    userFacingName() {
        return "review";
    },
    async getPromptForCommand(I) {
        return [ {
            role: "user",
            content: [ {
                type: "text",
                text: `
      You are an expert code reviewer. Follow these steps:

      1. If no PR number is provided in the args, use ${j4.name}("gh pr list") to show open PRs
      2. If a PR number is provided, use ${j4.name}("gh pr view <number>") to get PR details
      3. Use ${j4.name}("gh pr diff <number>") to get the diff
      4. Analyze the changes and provide a thorough code review that includes:
         - Overview of what the PR does
         - Analysis of code quality and style
         - Specific suggestions for improvements
         - Any potential issues or risks
      
      Keep your review concise but thorough. Focus on:
      - Code correctness
      - Following project conventions
      - Performance implications
      - Test coverage
      - Security considerations

      Format your review with clear sections and bullet points.

      PR number: ${I}
    `
            } ]
        } ];
    }
};

var ZR3 = A1(u1(), 1);

var dR3 = A1(u1(), 1);

function WR3() {
    let I = Q2(), Z = (I.editorMode || "emacs") === "emacs" ? "vim" : "emacs";
    return i4({
        ...I,
        editorMode: Z
    }), B0("tengu_editor_mode_changed", {
        mode: Z,
        source: "command"
    }), Promise.resolve(`Editor mode set to ${Z}. ${Z === "vim" ? "Use Escape key to toggle between INSERT and NORMAL modes." : "Using standard emacs-style keybindings."}`);
}

var BR3 = {
    name: "vim",
    description: "Toggle between vim and emacs editing modes",
    isEnabled: !1,
    isHidden: !1,
    type: "local",
    userFacingName: () => "vim",
    call: WR3
}, eL2 = BR3;

var X9 = A1(u1(), 1);

var wf1 = A1(u1(), 1);

var wR3 = ({
    tool: I
}) => {
    let [ G, Z ] = I.split(/[()]/);
    if (G !== "Bash" || Z === void 0) return null;
    if (Z.endsWith(":*")) return X9.createElement(O, null, "Any Bash command starting with ", X9.createElement(O, {
        bold: !0
    }, Z.slice(0, -2))); else return X9.createElement(O, null, "The Bash command ", X9.createElement(O, {
        bold: !0
    }, Z));
}, VR3 = ({
    tool: I,
    onDelete: G,
    onCancel: Z
}) => {
    let d = e1(), W = [ {
        label: "Delete",
        value: "delete"
    }, {
        label: "Cancel",
        value: "cancel"
    } ];
    _4((w, V) => {
        if (V.escape || V.ctrl && w === "c") Z();
    });
    let B = w => {
        if (w === "delete") G(); else Z();
    };
    return X9.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1,
        borderColor: d.permission
    }, X9.createElement(O, {
        bold: !0,
        color: d.permission
    }, "Edit approved tool"), X9.createElement(p, {
        flexDirection: "column",
        marginX: 2,
        marginY: 1
    }, X9.createElement(O, {
        bold: !0
    }, I), X9.createElement(wR3, {
        tool: I
    })), X9.createElement(O, null, "If deleted, you will have to confirm the next time ", b2, " tries to use this tool."), X9.createElement(tI, {
        options: W,
        onChange: B,
        visibleOptionCount: W.length
    }));
}, CR3 = ({
    onClose: I
}) => {
    let [ G, Z ] = wf1.useState(() => {
        return [ ...E4().allowedTools || [] ];
    }), [ d, W ] = wf1.useState(), B = e1(), w = [ ...G.map(X => ({
        label: X,
        value: X
    })), {
        label: `Done (${T0.bold.hex(B.warning)("esc")})`,
        value: "exit"
    } ];
    _4((X, Y) => {
        if (!d && (Y.escape || Y.ctrl && X === "c")) I();
    });
    let V = X => {
        if (X === "exit") {
            I();
            return;
        }
        W(X);
    }, C = () => {
        if (!d) return;
        let X = E4(), Y = X.allowedTools.filter(D => D !== d);
        X.allowedTools = Y, h3(X);
        let A = G.filter(D => D !== d);
        if (Z(A), G.length === 1) I("All approved tools have been removed."); else W(void 0);
    };
    if (d) return X9.createElement(VR3, {
        tool: d,
        onDelete: C,
        onCancel: () => W(void 0)
    });
    return X9.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1,
        borderColor: B.permission
    }, X9.createElement(O, {
        bold: !0,
        color: B.permission
    }, "Approved tools for ", u0(), X9.createElement(R5, null)), X9.createElement(O, null, b2, " won't ask before using these tools."), X9.createElement(p, {
        marginY: 1
    }, G.length === 0 && X9.createElement(O, null, "No approved tools."), X9.createElement(tI, {
        options: w,
        onChange: V,
        visibleOptionCount: Math.min(10, w.length)
    })));
}, XR3 = {
    type: "local-jsx",
    name: "approved-tools",
    description: "List all currently approved tools",
    isEnabled: !0,
    isHidden: !1,
    async call(I, G) {
        return X9.createElement(CR3, {
            onClose: I
        });
    },
    userFacingName() {
        return "approved-tools";
    }
}, tL2 = XR3;

var DR3 = A1(u1(), 1);

var _R3 = A1(u1(), 1);

var YR3 = A1(u1(), 1);

var h46 = e.enum([ "project", "global", "mcprc" ]), Cf1 = e.object({
    type: e.literal("stdio").optional(),
    command: e.string().min(1, "Command cannot be empty"),
    args: e.array(e.string()).default([]),
    env: e.record(e.string()).optional()
}), FR3 = e.object({
    type: e.literal("sse"),
    url: e.string().url("Must be a valid URL")
}), c46 = e.discriminatedUnion("type", [ Cf1, FR3 ]);

import {
    existsSync as FP2,
    readFileSync as JP2,
    writeFileSync as KP2
} from "fs";

import {
    join as zP2
} from "path";

var gT = "2024-11-05", d01 = [ gT, "2024-10-07" ], W01 = "2.0", IP2 = e.union([ e.string(), e.number().int() ]), GP2 = e.string(), QV = e.object({
    _meta: e.optional(e.object({
        progressToken: e.optional(IP2)
    }).passthrough())
}).passthrough(), ZW = e.object({
    method: e.string(),
    params: e.optional(QV)
}), UT = e.object({
    _meta: e.optional(e.object({}).passthrough())
}).passthrough(), jX = e.object({
    method: e.string(),
    params: e.optional(UT)
}), NV = e.object({
    _meta: e.optional(e.object({}).passthrough())
}).passthrough(), B01 = e.union([ e.string(), e.number().int() ]), JR3 = e.object({
    jsonrpc: e.literal(W01),
    id: B01
}).merge(ZW).strict(), KR3 = e.object({
    jsonrpc: e.literal(W01)
}).merge(jX).strict(), zR3 = e.object({
    jsonrpc: e.literal(W01),
    id: B01,
    result: NV
}).strict(), fN;

(function(I) {
    I[I.ConnectionClosed = -32e3] = "ConnectionClosed", I[I.RequestTimeout = -32001] = "RequestTimeout", 
    I[I.ParseError = -32700] = "ParseError", I[I.InvalidRequest = -32600] = "InvalidRequest", 
    I[I.MethodNotFound = -32601] = "MethodNotFound", I[I.InvalidParams = -32602] = "InvalidParams", 
    I[I.InternalError = -32603] = "InternalError";
})(fN || (fN = {}));

var QR3 = e.object({
    jsonrpc: e.literal(W01),
    id: B01,
    error: e.object({
        code: e.number().int(),
        message: e.string(),
        data: e.optional(e.unknown())
    })
}).strict(), w01 = e.union([ JR3, KR3, zR3, QR3 ]), W_ = NV.strict(), V01 = jX.extend({
    method: e.literal("notifications/cancelled"),
    params: UT.extend({
        requestId: B01,
        reason: e.string().optional()
    })
}), ZP2 = e.object({
    name: e.string(),
    version: e.string()
}).passthrough(), NR3 = e.object({
    experimental: e.optional(e.object({}).passthrough()),
    sampling: e.optional(e.object({}).passthrough()),
    roots: e.optional(e.object({
        listChanged: e.optional(e.boolean())
    }).passthrough())
}).passthrough(), Xf1 = ZW.extend({
    method: e.literal("initialize"),
    params: QV.extend({
        protocolVersion: e.string(),
        capabilities: NR3,
        clientInfo: ZP2
    })
}), qR3 = e.object({
    experimental: e.optional(e.object({}).passthrough()),
    logging: e.optional(e.object({}).passthrough()),
    prompts: e.optional(e.object({
        listChanged: e.optional(e.boolean())
    }).passthrough()),
    resources: e.optional(e.object({
        subscribe: e.optional(e.boolean()),
        listChanged: e.optional(e.boolean())
    }).passthrough()),
    tools: e.optional(e.object({
        listChanged: e.optional(e.boolean())
    }).passthrough())
}).passthrough(), Yf1 = NV.extend({
    protocolVersion: e.string(),
    capabilities: qR3,
    serverInfo: ZP2,
    instructions: e.optional(e.string())
}), Af1 = jX.extend({
    method: e.literal("notifications/initialized")
}), C01 = ZW.extend({
    method: e.literal("ping")
}), gR3 = e.object({
    progress: e.number(),
    total: e.optional(e.number())
}).passthrough(), X01 = jX.extend({
    method: e.literal("notifications/progress"),
    params: UT.merge(gR3).extend({
        progressToken: IP2
    })
}), Y01 = ZW.extend({
    params: QV.extend({
        cursor: e.optional(GP2)
    }).optional()
}), A01 = NV.extend({
    nextCursor: e.optional(GP2)
}), dP2 = e.object({
    uri: e.string(),
    mimeType: e.optional(e.string())
}).passthrough(), WP2 = dP2.extend({
    text: e.string()
}), BP2 = dP2.extend({
    blob: e.string().base64()
}), UR3 = e.object({
    uri: e.string(),
    name: e.string(),
    description: e.optional(e.string()),
    mimeType: e.optional(e.string())
}).passthrough(), fR3 = e.object({
    uriTemplate: e.string(),
    name: e.string(),
    description: e.optional(e.string()),
    mimeType: e.optional(e.string())
}).passthrough(), RR3 = Y01.extend({
    method: e.literal("resources/list")
}), _f1 = A01.extend({
    resources: e.array(UR3)
}), vR3 = Y01.extend({
    method: e.literal("resources/templates/list")
}), Hf1 = A01.extend({
    resourceTemplates: e.array(fR3)
}), ER3 = ZW.extend({
    method: e.literal("resources/read"),
    params: QV.extend({
        uri: e.string()
    })
}), Df1 = NV.extend({
    contents: e.array(e.union([ WP2, BP2 ]))
}), MR3 = jX.extend({
    method: e.literal("notifications/resources/list_changed")
}), $R3 = ZW.extend({
    method: e.literal("resources/subscribe"),
    params: QV.extend({
        uri: e.string()
    })
}), SR3 = ZW.extend({
    method: e.literal("resources/unsubscribe"),
    params: QV.extend({
        uri: e.string()
    })
}), LR3 = jX.extend({
    method: e.literal("notifications/resources/updated"),
    params: UT.extend({
        uri: e.string()
    })
}), PR3 = e.object({
    name: e.string(),
    description: e.optional(e.string()),
    required: e.optional(e.boolean())
}).passthrough(), uR3 = e.object({
    name: e.string(),
    description: e.optional(e.string()),
    arguments: e.optional(e.array(PR3))
}).passthrough(), yR3 = Y01.extend({
    method: e.literal("prompts/list")
}), fT = A01.extend({
    prompts: e.array(uR3)
}), OR3 = ZW.extend({
    method: e.literal("prompts/get"),
    params: QV.extend({
        name: e.string(),
        arguments: e.optional(e.record(e.string()))
    })
}), _01 = e.object({
    type: e.literal("text"),
    text: e.string()
}).passthrough(), H01 = e.object({
    type: e.literal("image"),
    data: e.string().base64(),
    mimeType: e.string()
}).passthrough(), wP2 = e.object({
    type: e.literal("resource"),
    resource: e.union([ WP2, BP2 ])
}).passthrough(), mR3 = e.object({
    role: e.enum([ "user", "assistant" ]),
    content: e.union([ _01, H01, wP2 ])
}).passthrough(), Ff1 = NV.extend({
    description: e.optional(e.string()),
    messages: e.array(mR3)
}), TR3 = jX.extend({
    method: e.literal("notifications/prompts/list_changed")
}), bR3 = e.object({
    name: e.string(),
    description: e.optional(e.string()),
    inputSchema: e.object({
        type: e.literal("object"),
        properties: e.optional(e.object({}).passthrough())
    }).passthrough()
}).passthrough(), Jf1 = Y01.extend({
    method: e.literal("tools/list")
}), RT = A01.extend({
    tools: e.array(bR3)
}), bE = NV.extend({
    content: e.array(e.union([ _01, H01, wP2 ])),
    isError: e.boolean().default(!1).optional()
}), n46 = bE.or(NV.extend({
    toolResult: e.unknown()
})), Kf1 = ZW.extend({
    method: e.literal("tools/call"),
    params: QV.extend({
        name: e.string(),
        arguments: e.optional(e.record(e.unknown()))
    })
}), jR3 = jX.extend({
    method: e.literal("notifications/tools/list_changed")
}), VP2 = e.enum([ "debug", "info", "notice", "warning", "error", "critical", "alert", "emergency" ]), lR3 = ZW.extend({
    method: e.literal("logging/setLevel"),
    params: QV.extend({
        level: VP2
    })
}), kR3 = jX.extend({
    method: e.literal("notifications/message"),
    params: UT.extend({
        level: VP2,
        logger: e.optional(e.string()),
        data: e.unknown()
    })
}), xR3 = e.object({
    name: e.string().optional()
}).passthrough(), hR3 = e.object({
    hints: e.optional(e.array(xR3)),
    costPriority: e.optional(e.number().min(0).max(1)),
    speedPriority: e.optional(e.number().min(0).max(1)),
    intelligencePriority: e.optional(e.number().min(0).max(1))
}).passthrough(), cR3 = e.object({
    role: e.enum([ "user", "assistant" ]),
    content: e.union([ _01, H01 ])
}).passthrough(), pR3 = ZW.extend({
    method: e.literal("sampling/createMessage"),
    params: QV.extend({
        messages: e.array(cR3),
        systemPrompt: e.optional(e.string()),
        includeContext: e.optional(e.enum([ "none", "thisServer", "allServers" ])),
        temperature: e.optional(e.number()),
        maxTokens: e.number().int(),
        stopSequences: e.optional(e.array(e.string())),
        metadata: e.optional(e.object({}).passthrough()),
        modelPreferences: e.optional(hR3)
    })
}), zf1 = NV.extend({
    model: e.string(),
    stopReason: e.optional(e.enum([ "endTurn", "stopSequence", "maxTokens" ]).or(e.string())),
    role: e.enum([ "user", "assistant" ]),
    content: e.discriminatedUnion("type", [ _01, H01 ])
}), iR3 = e.object({
    type: e.literal("ref/resource"),
    uri: e.string()
}).passthrough(), nR3 = e.object({
    type: e.literal("ref/prompt"),
    name: e.string()
}).passthrough(), aR3 = ZW.extend({
    method: e.literal("completion/complete"),
    params: QV.extend({
        ref: e.union([ nR3, iR3 ]),
        argument: e.object({
            name: e.string(),
            value: e.string()
        }).passthrough()
    })
}), Qf1 = NV.extend({
    completion: e.object({
        values: e.array(e.string()).max(100),
        total: e.optional(e.number().int()),
        hasMore: e.optional(e.boolean())
    }).passthrough()
}), rR3 = e.object({
    uri: e.string().startsWith("file://"),
    name: e.optional(e.string())
}).passthrough(), sR3 = ZW.extend({
    method: e.literal("roots/list")
}), Nf1 = NV.extend({
    roots: e.array(rR3)
}), oR3 = jX.extend({
    method: e.literal("notifications/roots/list_changed")
}), a46 = e.union([ C01, Xf1, aR3, lR3, OR3, yR3, RR3, vR3, ER3, $R3, SR3, Kf1, Jf1 ]), r46 = e.union([ V01, X01, Af1, oR3 ]), s46 = e.union([ W_, zf1, Nf1 ]), o46 = e.union([ C01, pR3, sR3 ]), e46 = e.union([ V01, X01, kR3, LR3, MR3, jR3, TR3 ]), t46 = e.union([ W_, Yf1, Qf1, Ff1, fT, _f1, Hf1, Df1, bE, RT ]);

class vT extends Error {
    constructor(I, G, Z) {
        super(`MCP error ${I}: ${G}`);
        this.code = I, this.data = Z;
    }
}

var eR3 = 6e4;

class ET {
    constructor(I) {
        this._options = I, this._requestMessageId = 0, this._requestHandlers = new Map(), 
        this._requestHandlerAbortControllers = new Map(), this._notificationHandlers = new Map(), 
        this._responseHandlers = new Map(), this._progressHandlers = new Map(), 
        this.setNotificationHandler(V01, G => {
            let Z = this._requestHandlerAbortControllers.get(G.params.requestId);
            Z === null || Z === void 0 || Z.abort(G.params.reason);
        }), this.setNotificationHandler(X01, G => {
            this._onprogress(G);
        }), this.setRequestHandler(C01, G => ({}));
    }
    async connect(I) {
        this._transport = I, this._transport.onclose = () => {
            this._onclose();
        }, this._transport.onerror = G => {
            this._onerror(G);
        }, this._transport.onmessage = G => {
            if (!("method" in G)) this._onresponse(G); else if ("id" in G) this._onrequest(G); else this._onnotification(G);
        }, await this._transport.start();
    }
    _onclose() {
        var I;
        let G = this._responseHandlers;
        this._responseHandlers = new Map(), this._progressHandlers.clear(), this._transport = void 0, 
        (I = this.onclose) === null || I === void 0 || I.call(this);
        let Z = new vT(fN.ConnectionClosed, "Connection closed");
        for (let d of G.values()) d(Z);
    }
    _onerror(I) {
        var G;
        (G = this.onerror) === null || G === void 0 || G.call(this, I);
    }
    _onnotification(I) {
        var G;
        let Z = (G = this._notificationHandlers.get(I.method)) !== null && G !== void 0 ? G : this.fallbackNotificationHandler;
        if (Z === void 0) return;
        Promise.resolve().then(() => Z(I)).catch(d => this._onerror(new Error(`Uncaught error in notification handler: ${d}`)));
    }
    _onrequest(I) {
        var G, Z;
        let d = (G = this._requestHandlers.get(I.method)) !== null && G !== void 0 ? G : this.fallbackRequestHandler;
        if (d === void 0) {
            (Z = this._transport) === null || Z === void 0 || Z.send({
                jsonrpc: "2.0",
                id: I.id,
                error: {
                    code: fN.MethodNotFound,
                    message: "Method not found"
                }
            }).catch(B => this._onerror(new Error(`Failed to send an error response: ${B}`)));
            return;
        }
        let W = new AbortController();
        this._requestHandlerAbortControllers.set(I.id, W), Promise.resolve().then(() => d(I, {
            signal: W.signal
        })).then(B => {
            var w;
            if (W.signal.aborted) return;
            return (w = this._transport) === null || w === void 0 ? void 0 : w.send({
                result: B,
                jsonrpc: "2.0",
                id: I.id
            });
        }, B => {
            var w, V;
            if (W.signal.aborted) return;
            return (w = this._transport) === null || w === void 0 ? void 0 : w.send({
                jsonrpc: "2.0",
                id: I.id,
                error: {
                    code: Number.isSafeInteger(B.code) ? B.code : fN.InternalError,
                    message: (V = B.message) !== null && V !== void 0 ? V : "Internal error"
                }
            });
        }).catch(B => this._onerror(new Error(`Failed to send response: ${B}`))).finally(() => {
            this._requestHandlerAbortControllers.delete(I.id);
        });
    }
    _onprogress(I) {
        let {
            progressToken: G,
            ...Z
        } = I.params, d = this._progressHandlers.get(Number(G));
        if (d === void 0) {
            this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(I)}`));
            return;
        }
        d(Z);
    }
    _onresponse(I) {
        let G = I.id, Z = this._responseHandlers.get(Number(G));
        if (Z === void 0) {
            this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(I)}`));
            return;
        }
        if (this._responseHandlers.delete(Number(G)), this._progressHandlers.delete(Number(G)), 
        "result" in I) Z(I); else {
            let d = new vT(I.error.code, I.error.message, I.error.data);
            Z(d);
        }
    }
    get transport() {
        return this._transport;
    }
    async close() {
        var I;
        await ((I = this._transport) === null || I === void 0 ? void 0 : I.close());
    }
    request(I, G, Z) {
        return new Promise((d, W) => {
            var B, w, V, C;
            if (!this._transport) {
                W(new Error("Not connected"));
                return;
            }
            if (((B = this._options) === null || B === void 0 ? void 0 : B.enforceStrictCapabilities) === !0) this.assertCapabilityForMethod(I.method);
            (w = Z === null || Z === void 0 ? void 0 : Z.signal) === null || w === void 0 || w.throwIfAborted();
            let X = this._requestMessageId++, Y = {
                ...I,
                jsonrpc: "2.0",
                id: X
            };
            if (Z === null || Z === void 0 ? void 0 : Z.onprogress) this._progressHandlers.set(X, Z.onprogress), 
            Y.params = {
                ...I.params,
                _meta: {
                    progressToken: X
                }
            };
            let A = void 0;
            this._responseHandlers.set(X, K => {
                var z;
                if (A !== void 0) clearTimeout(A);
                if ((z = Z === null || Z === void 0 ? void 0 : Z.signal) === null || z === void 0 ? void 0 : z.aborted) return;
                if (K instanceof Error) return W(K);
                try {
                    let Q = G.parse(K.result);
                    d(Q);
                } catch (Q) {
                    W(Q);
                }
            });
            let D = K => {
                var z;
                this._responseHandlers.delete(X), this._progressHandlers.delete(X), 
                (z = this._transport) === null || z === void 0 || z.send({
                    jsonrpc: "2.0",
                    method: "notifications/cancelled",
                    params: {
                        requestId: X,
                        reason: String(K)
                    }
                }).catch(Q => this._onerror(new Error(`Failed to send cancellation: ${Q}`))), 
                W(K);
            };
            (V = Z === null || Z === void 0 ? void 0 : Z.signal) === null || V === void 0 || V.addEventListener("abort", () => {
                var K;
                if (A !== void 0) clearTimeout(A);
                D((K = Z === null || Z === void 0 ? void 0 : Z.signal) === null || K === void 0 ? void 0 : K.reason);
            });
            let J = (C = Z === null || Z === void 0 ? void 0 : Z.timeout) !== null && C !== void 0 ? C : eR3;
            A = setTimeout(() => D(new vT(fN.RequestTimeout, "Request timed out", {
                timeout: J
            })), J), this._transport.send(Y).catch(K => {
                if (A !== void 0) clearTimeout(A);
                W(K);
            });
        });
    }
    async notification(I) {
        if (!this._transport) throw new Error("Not connected");
        this.assertNotificationCapability(I.method);
        let G = {
            ...I,
            jsonrpc: "2.0"
        };
        await this._transport.send(G);
    }
    setRequestHandler(I, G) {
        let Z = I.shape.method.value;
        this.assertRequestHandlerCapability(Z), this._requestHandlers.set(Z, (d, W) => Promise.resolve(G(I.parse(d), W)));
    }
    removeRequestHandler(I) {
        this._requestHandlers.delete(I);
    }
    assertCanSetRequestHandler(I) {
        if (this._requestHandlers.has(I)) throw new Error(`A request handler for ${I} already exists, which would be overridden`);
    }
    setNotificationHandler(I, G) {
        this._notificationHandlers.set(I.shape.method.value, Z => Promise.resolve(G(I.parse(Z))));
    }
    removeNotificationHandler(I) {
        this._notificationHandlers.delete(I);
    }
}

function D01(I, G) {
    return Object.entries(G).reduce((Z, [ d, W ]) => {
        if (W && typeof W === "object") Z[d] = Z[d] ? {
            ...Z[d],
            ...W
        } : W; else Z[d] = W;
        return Z;
    }, {
        ...I
    });
}

class qf1 extends ET {
    constructor(I, G) {
        var Z;
        super(G);
        this._clientInfo = I, this._capabilities = (Z = G === null || G === void 0 ? void 0 : G.capabilities) !== null && Z !== void 0 ? Z : {};
    }
    registerCapabilities(I) {
        if (this.transport) throw new Error("Cannot register capabilities after connecting to transport");
        this._capabilities = D01(this._capabilities, I);
    }
    assertCapability(I, G) {
        var Z;
        if (!((Z = this._serverCapabilities) === null || Z === void 0 ? void 0 : Z[I])) throw new Error(`Server does not support ${I} (required for ${G})`);
    }
    async connect(I) {
        await super.connect(I);
        try {
            let G = await this.request({
                method: "initialize",
                params: {
                    protocolVersion: gT,
                    capabilities: this._capabilities,
                    clientInfo: this._clientInfo
                }
            }, Yf1);
            if (G === void 0) throw new Error(`Server sent invalid initialize result: ${G}`);
            if (!d01.includes(G.protocolVersion)) throw new Error(`Server's protocol version is not supported: ${G.protocolVersion}`);
            this._serverCapabilities = G.capabilities, this._serverVersion = G.serverInfo, 
            this._instructions = G.instructions, await this.notification({
                method: "notifications/initialized"
            });
        } catch (G) {
            throw this.close(), G;
        }
    }
    getServerCapabilities() {
        return this._serverCapabilities;
    }
    getServerVersion() {
        return this._serverVersion;
    }
    getInstructions() {
        return this._instructions;
    }
    assertCapabilityForMethod(I) {
        var G, Z, d, W, B;
        switch (I) {
          case "logging/setLevel":
            if (!((G = this._serverCapabilities) === null || G === void 0 ? void 0 : G.logging)) throw new Error(`Server does not support logging (required for ${I})`);
            break;

          case "prompts/get":
          case "prompts/list":
            if (!((Z = this._serverCapabilities) === null || Z === void 0 ? void 0 : Z.prompts)) throw new Error(`Server does not support prompts (required for ${I})`);
            break;

          case "resources/list":
          case "resources/templates/list":
          case "resources/read":
          case "resources/subscribe":
          case "resources/unsubscribe":
            if (!((d = this._serverCapabilities) === null || d === void 0 ? void 0 : d.resources)) throw new Error(`Server does not support resources (required for ${I})`);
            if (I === "resources/subscribe" && !this._serverCapabilities.resources.subscribe) throw new Error(`Server does not support resource subscriptions (required for ${I})`);
            break;

          case "tools/call":
          case "tools/list":
            if (!((W = this._serverCapabilities) === null || W === void 0 ? void 0 : W.tools)) throw new Error(`Server does not support tools (required for ${I})`);
            break;

          case "completion/complete":
            if (!((B = this._serverCapabilities) === null || B === void 0 ? void 0 : B.prompts)) throw new Error(`Server does not support prompts (required for ${I})`);
            break;

          case "initialize":
            break;

          case "ping":
            break;
        }
    }
    assertNotificationCapability(I) {
        var G;
        switch (I) {
          case "notifications/roots/list_changed":
            if (!((G = this._capabilities.roots) === null || G === void 0 ? void 0 : G.listChanged)) throw new Error(`Client does not support roots list changed notifications (required for ${I})`);
            break;

          case "notifications/initialized":
            break;

          case "notifications/cancelled":
            break;

          case "notifications/progress":
            break;
        }
    }
    assertRequestHandlerCapability(I) {
        switch (I) {
          case "sampling/createMessage":
            if (!this._capabilities.sampling) throw new Error(`Client does not support sampling capability (required for ${I})`);
            break;

          case "roots/list":
            if (!this._capabilities.roots) throw new Error(`Client does not support roots capability (required for ${I})`);
            break;

          case "ping":
            break;
        }
    }
    async ping(I) {
        return this.request({
            method: "ping"
        }, W_, I);
    }
    async complete(I, G) {
        return this.request({
            method: "completion/complete",
            params: I
        }, Qf1, G);
    }
    async setLoggingLevel(I, G) {
        return this.request({
            method: "logging/setLevel",
            params: {
                level: I
            }
        }, W_, G);
    }
    async getPrompt(I, G) {
        return this.request({
            method: "prompts/get",
            params: I
        }, Ff1, G);
    }
    async listPrompts(I, G) {
        return this.request({
            method: "prompts/list",
            params: I
        }, fT, G);
    }
    async listResources(I, G) {
        return this.request({
            method: "resources/list",
            params: I
        }, _f1, G);
    }
    async listResourceTemplates(I, G) {
        return this.request({
            method: "resources/templates/list",
            params: I
        }, Hf1, G);
    }
    async readResource(I, G) {
        return this.request({
            method: "resources/read",
            params: I
        }, Df1, G);
    }
    async subscribeResource(I, G) {
        return this.request({
            method: "resources/subscribe",
            params: I
        }, W_, G);
    }
    async unsubscribeResource(I, G) {
        return this.request({
            method: "resources/unsubscribe",
            params: I
        }, W_, G);
    }
    async callTool(I, G = bE, Z) {
        return this.request({
            method: "tools/call",
            params: I
        }, G, Z);
    }
    async listTools(I, G) {
        return this.request({
            method: "tools/list",
            params: I
        }, RT, G);
    }
    async sendRootsListChanged() {
        return this.notification({
            method: "notifications/roots/list_changed"
        });
    }
}

import {
    spawn as Iv3
} from "node:child_process";

import J01 from "node:process";

class MT {
    append(I) {
        this._buffer = this._buffer ? Buffer.concat([ this._buffer, I ]) : I;
    }
    readMessage() {
        if (!this._buffer) return null;
        let I = this._buffer.indexOf(`
`);
        if (I === -1) return null;
        let G = this._buffer.toString("utf8", 0, I);
        return this._buffer = this._buffer.subarray(I + 1), tR3(G);
    }
    clear() {
        this._buffer = void 0;
    }
}

function tR3(I) {
    return w01.parse(JSON.parse(I));
}

function F01(I) {
    return JSON.stringify(I) + `
`;
}

var Gv3 = J01.platform === "win32" ? [ "APPDATA", "HOMEDRIVE", "HOMEPATH", "LOCALAPPDATA", "PATH", "PROCESSOR_ARCHITECTURE", "SYSTEMDRIVE", "SYSTEMROOT", "TEMP", "USERNAME", "USERPROFILE" ] : [ "HOME", "LOGNAME", "PATH", "SHELL", "TERM", "USER" ];

function Zv3() {
    let I = {};
    for (let G of Gv3) {
        let Z = J01.env[G];
        if (Z === void 0) continue;
        if (Z.startsWith("()")) continue;
        I[G] = Z;
    }
    return I;
}

class gf1 {
    constructor(I) {
        this._abortController = new AbortController(), this._readBuffer = new MT(), 
        this._serverParams = I;
    }
    async start() {
        if (this._process) throw new Error("StdioClientTransport already started! If using Client class, note that connect() calls start() automatically.");
        return new Promise((I, G) => {
            var Z, d, W, B, w, V;
            this._process = Iv3(this._serverParams.command, (Z = this._serverParams.args) !== null && Z !== void 0 ? Z : [], {
                env: (d = this._serverParams.env) !== null && d !== void 0 ? d : Zv3(),
                stdio: [ "pipe", "pipe", (W = this._serverParams.stderr) !== null && W !== void 0 ? W : "inherit" ],
                shell: !1,
                signal: this._abortController.signal,
                windowsHide: J01.platform === "win32" && dv3()
            }), this._process.on("error", C => {
                var X, Y;
                if (C.name === "AbortError") {
                    (X = this.onclose) === null || X === void 0 || X.call(this);
                    return;
                }
                G(C), (Y = this.onerror) === null || Y === void 0 || Y.call(this, C);
            }), this._process.on("spawn", () => {
                I();
            }), this._process.on("close", C => {
                var X;
                this._process = void 0, (X = this.onclose) === null || X === void 0 || X.call(this);
            }), (B = this._process.stdin) === null || B === void 0 || B.on("error", C => {
                var X;
                (X = this.onerror) === null || X === void 0 || X.call(this, C);
            }), (w = this._process.stdout) === null || w === void 0 || w.on("data", C => {
                this._readBuffer.append(C), this.processReadBuffer();
            }), (V = this._process.stdout) === null || V === void 0 || V.on("error", C => {
                var X;
                (X = this.onerror) === null || X === void 0 || X.call(this, C);
            });
        });
    }
    get stderr() {
        var I, G;
        return (G = (I = this._process) === null || I === void 0 ? void 0 : I.stderr) !== null && G !== void 0 ? G : null;
    }
    processReadBuffer() {
        var I, G;
        while (!0) try {
            let Z = this._readBuffer.readMessage();
            if (Z === null) break;
            (I = this.onmessage) === null || I === void 0 || I.call(this, Z);
        } catch (Z) {
            (G = this.onerror) === null || G === void 0 || G.call(this, Z);
        }
    }
    async close() {
        this._abortController.abort(), this._process = void 0, this._readBuffer.clear();
    }
    send(I) {
        return new Promise(G => {
            var Z;
            if (!((Z = this._process) === null || Z === void 0 ? void 0 : Z.stdin)) throw new Error("Not connected");
            let d = F01(I);
            if (this._process.stdin.write(d)) G(); else this._process.stdin.once("drain", G);
        });
    }
}

function dv3() {
    return "type" in J01;
}

var Wv3 = Object.defineProperty, Bv3 = (I, G, Z) => G in I ? Wv3(I, G, {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Z
}) : I[G] = Z, K01 = (I, G, Z) => Bv3(I, typeof G != "symbol" ? G + "" : G, Z);

class ff1 extends Error {
    constructor(I, G) {
        super(I), K01(this, "type"), K01(this, "field"), K01(this, "value"), K01(this, "line"), 
        this.name = "ParseError", this.type = G.type, this.field = G.field, this.value = G.value, 
        this.line = G.line;
    }
}

function Uf1(I) {}

function CP2(I) {
    let {
        onEvent: G = Uf1,
        onError: Z = Uf1,
        onRetry: d = Uf1,
        onComment: W
    } = I, B = "", w = !0, V, C = "", X = "";
    function Y(z) {
        let Q = w ? z.replace(/^\xEF\xBB\xBF/, "") : z, [ U, M ] = wv3(`${B}${Q}`);
        for (let S of U) A(S);
        B = M, w = !1;
    }
    function A(z) {
        if (z === "") {
            J();
            return;
        }
        if (z.startsWith(":")) {
            W && W(z.slice(z.startsWith(": ") ? 2 : 1));
            return;
        }
        let Q = z.indexOf(":");
        if (Q !== -1) {
            let U = z.slice(0, Q), M = z[Q + 1] === " " ? 2 : 1, S = z.slice(Q + M);
            D(U, S, z);
            return;
        }
        D(z, "", z);
    }
    function D(z, Q, U) {
        switch (z) {
          case "event":
            X = Q;
            break;

          case "data":
            C = `${C}${Q}
`;
            break;

          case "id":
            V = Q.includes("\0") ? void 0 : Q;
            break;

          case "retry":
            /^\d+$/.test(Q) ? d(parseInt(Q, 10)) : Z(new ff1(`Invalid \`retry\` value: "${Q}"`, {
                type: "invalid-retry",
                value: Q,
                line: U
            }));
            break;

          default:
            Z(new ff1(`Unknown field "${z.length > 20 ? `${z.slice(0, 20)}…` : z}"`, {
                type: "unknown-field",
                field: z,
                value: Q,
                line: U
            }));
            break;
        }
    }
    function J() {
        C.length > 0 && G({
            id: V,
            event: X || void 0,
            data: C.endsWith(`
`) ? C.slice(0, -1) : C
        }), V = void 0, C = "", X = "";
    }
    function K(z = {}) {
        B && z.consume && A(B), V = void 0, C = "", X = "", B = "";
    }
    return {
        feed: Y,
        reset: K
    };
}

function wv3(I) {
    let G = [], Z = "", d = I.length;
    for (let W = 0; W < d; W++) {
        let B = I[W];
        B === "\r" && I[W + 1] === `
` ? (G.push(Z), Z = "", W++) : B === "\r" || B === `
` ? (G.push(Z), Z = "") : Z += B;
    }
    return [ G, Z ];
}

class Rf1 extends Event {}

function Vv3(I) {
    let G = globalThis.DOMException;
    return typeof G == "function" ? new G(I, "SyntaxError") : new SyntaxError(I);
}

var YP2 = I => {
    throw TypeError(I);
}, uf1 = (I, G, Z) => G.has(I) || YP2("Cannot " + Z), R9 = (I, G, Z) => (uf1(I, G, "read from private field"), 
Z ? Z.call(I) : G.get(I)), d7 = (I, G, Z) => G.has(I) ? YP2("Cannot add the same private member more than once") : G instanceof WeakSet ? G.add(I) : G.set(I, Z), a5 = (I, G, Z, d) => (uf1(I, G, "write to private field"), 
G.set(I, Z), Z), B_ = (I, G, Z) => (uf1(I, G, "access private method"), Z), Wd, RN, jE, z01, Q01, LT, xE, PT, KJ, lE, hE, kE, $T, qV, vf1, Ef1, Mf1, XP2, $f1, Sf1, ST, Lf1, Pf1;

class cE extends EventTarget {
    constructor(I, G) {
        var Z, d;
        super(), d7(this, qV), this.CONNECTING = 0, this.OPEN = 1, this.CLOSED = 2, 
        d7(this, Wd), d7(this, RN), d7(this, jE), d7(this, z01), d7(this, Q01), 
        d7(this, LT), d7(this, xE), d7(this, PT, null), d7(this, KJ), d7(this, lE), 
        d7(this, hE, null), d7(this, kE, null), d7(this, $T, null), d7(this, Ef1, async W => {
            var B;
            R9(this, lE).reset();
            let {
                body: w,
                redirected: V,
                status: C,
                headers: X
            } = W;
            if (C === 204) {
                B_(this, qV, ST).call(this, "Server sent HTTP 204, not reconnecting", 204), 
                this.close();
                return;
            }
            if (V ? a5(this, jE, new URL(W.url)) : a5(this, jE, void 0), C !== 200) {
                B_(this, qV, ST).call(this, `Non-200 status code (${C})`, C);
                return;
            }
            if (!(X.get("content-type") || "").startsWith("text/event-stream")) {
                B_(this, qV, ST).call(this, 'Invalid content type, expected "text/event-stream"', C);
                return;
            }
            if (R9(this, Wd) === this.CLOSED) return;
            a5(this, Wd, this.OPEN);
            let Y = new Event("open");
            if ((B = R9(this, $T)) == null || B.call(this, Y), this.dispatchEvent(Y), 
            typeof w != "object" || !w || !("getReader" in w)) {
                B_(this, qV, ST).call(this, "Invalid response body, expected a web ReadableStream", C), 
                this.close();
                return;
            }
            let A = new TextDecoder(), D = w.getReader(), J = !0;
            do {
                let {
                    done: K,
                    value: z
                } = await D.read();
                z && R9(this, lE).feed(A.decode(z, {
                    stream: !K
                })), K && (J = !1, R9(this, lE).reset(), B_(this, qV, Lf1).call(this));
            } while (J);
        }), d7(this, Mf1, W => {
            a5(this, KJ, void 0), !(W.name === "AbortError" || W.type === "aborted") && B_(this, qV, Lf1).call(this);
        }), d7(this, $f1, W => {
            typeof W.id == "string" && a5(this, PT, W.id);
            let B = new MessageEvent(W.event || "message", {
                data: W.data,
                origin: R9(this, jE) ? R9(this, jE).origin : R9(this, RN).origin,
                lastEventId: W.id || ""
            });
            R9(this, kE) && (!W.event || W.event === "message") && R9(this, kE).call(this, B), 
            this.dispatchEvent(B);
        }), d7(this, Sf1, W => {
            a5(this, LT, W);
        }), d7(this, Pf1, () => {
            a5(this, xE, void 0), R9(this, Wd) === this.CONNECTING && B_(this, qV, vf1).call(this);
        });
        try {
            if (I instanceof URL) a5(this, RN, I); else if (typeof I == "string") a5(this, RN, new URL(I, Cv3())); else throw new Error("Invalid URL");
        } catch {
            throw Vv3("An invalid or illegal string was specified");
        }
        a5(this, lE, CP2({
            onEvent: R9(this, $f1),
            onRetry: R9(this, Sf1)
        })), a5(this, Wd, this.CONNECTING), a5(this, LT, 3e3), a5(this, Q01, (Z = G == null ? void 0 : G.fetch) != null ? Z : globalThis.fetch), 
        a5(this, z01, (d = G == null ? void 0 : G.withCredentials) != null ? d : !1), 
        B_(this, qV, vf1).call(this);
    }
    get readyState() {
        return R9(this, Wd);
    }
    get url() {
        return R9(this, RN).href;
    }
    get withCredentials() {
        return R9(this, z01);
    }
    get onerror() {
        return R9(this, hE);
    }
    set onerror(I) {
        a5(this, hE, I);
    }
    get onmessage() {
        return R9(this, kE);
    }
    set onmessage(I) {
        a5(this, kE, I);
    }
    get onopen() {
        return R9(this, $T);
    }
    set onopen(I) {
        a5(this, $T, I);
    }
    addEventListener(I, G, Z) {
        let d = G;
        super.addEventListener(I, d, Z);
    }
    removeEventListener(I, G, Z) {
        let d = G;
        super.removeEventListener(I, d, Z);
    }
    close() {
        R9(this, xE) && clearTimeout(R9(this, xE)), R9(this, Wd) !== this.CLOSED && (R9(this, KJ) && R9(this, KJ).abort(), 
        a5(this, Wd, this.CLOSED), a5(this, KJ, void 0));
    }
}

Wd = new WeakMap(), RN = new WeakMap(), jE = new WeakMap(), z01 = new WeakMap(), 
Q01 = new WeakMap(), LT = new WeakMap(), xE = new WeakMap(), PT = new WeakMap(), 
KJ = new WeakMap(), lE = new WeakMap(), hE = new WeakMap(), kE = new WeakMap(), 
$T = new WeakMap(), qV = new WeakSet(), vf1 = function() {
    a5(this, Wd, this.CONNECTING), a5(this, KJ, new AbortController()), R9(this, Q01)(R9(this, RN), B_(this, qV, XP2).call(this)).then(R9(this, Ef1)).catch(R9(this, Mf1));
}, Ef1 = new WeakMap(), Mf1 = new WeakMap(), XP2 = function() {
    var I;
    let G = {
        mode: "cors",
        redirect: "follow",
        headers: {
            Accept: "text/event-stream",
            ...R9(this, PT) ? {
                "Last-Event-ID": R9(this, PT)
            } : void 0
        },
        cache: "no-store",
        signal: (I = R9(this, KJ)) == null ? void 0 : I.signal
    };
    return "window" in globalThis && (G.credentials = this.withCredentials ? "include" : "same-origin"), 
    G;
}, $f1 = new WeakMap(), Sf1 = new WeakMap(), ST = function(I, G) {
    var Z;
    R9(this, Wd) !== this.CLOSED && a5(this, Wd, this.CLOSED);
    let d = new Rf1("error");
    d.code = G, d.message = I, (Z = R9(this, hE)) == null || Z.call(this, d), this.dispatchEvent(d);
}, Lf1 = function() {
    var I;
    if (R9(this, Wd) === this.CLOSED) return;
    a5(this, Wd, this.CONNECTING);
    let G = new Rf1("error");
    (I = R9(this, hE)) == null || I.call(this, G), this.dispatchEvent(G), a5(this, xE, setTimeout(R9(this, Pf1), R9(this, LT)));
}, Pf1 = new WeakMap(), cE.CONNECTING = 0, cE.OPEN = 1, cE.CLOSED = 2;

function Cv3() {
    let I = "document" in globalThis ? globalThis.document : void 0;
    return I && typeof I == "object" && "baseURI" in I && typeof I.baseURI == "string" ? I.baseURI : void 0;
}

class AP2 extends Error {
    constructor(I, G, Z) {
        super(`SSE error: ${G}`);
        this.code = I, this.event = Z;
    }
}

class yf1 {
    constructor(I, G) {
        this._url = I, this._eventSourceInit = G === null || G === void 0 ? void 0 : G.eventSourceInit, 
        this._requestInit = G === null || G === void 0 ? void 0 : G.requestInit;
    }
    start() {
        if (this._eventSource) throw new Error("SSEClientTransport already started! If using Client class, note that connect() calls start() automatically.");
        return new Promise((I, G) => {
            this._eventSource = new cE(this._url.href, this._eventSourceInit), this._abortController = new AbortController(), 
            this._eventSource.onerror = Z => {
                var d;
                let W = new AP2(Z.code, Z.message, Z);
                G(W), (d = this.onerror) === null || d === void 0 || d.call(this, W);
            }, this._eventSource.onopen = () => {}, this._eventSource.addEventListener("endpoint", Z => {
                var d;
                let W = Z;
                try {
                    if (this._endpoint = new URL(W.data, this._url), this._endpoint.origin !== this._url.origin) throw new Error(`Endpoint origin does not match connection origin: ${this._endpoint.origin}`);
                } catch (B) {
                    G(B), (d = this.onerror) === null || d === void 0 || d.call(this, B), 
                    this.close();
                    return;
                }
                I();
            }), this._eventSource.onmessage = Z => {
                var d, W;
                let B = Z, w;
                try {
                    w = w01.parse(JSON.parse(B.data));
                } catch (V) {
                    (d = this.onerror) === null || d === void 0 || d.call(this, V);
                    return;
                }
                (W = this.onmessage) === null || W === void 0 || W.call(this, w);
            };
        });
    }
    async close() {
        var I, G, Z;
        (I = this._abortController) === null || I === void 0 || I.abort(), (G = this._eventSource) === null || G === void 0 || G.close(), 
        (Z = this.onclose) === null || Z === void 0 || Z.call(this);
    }
    async send(I) {
        var G, Z, d;
        if (!this._endpoint) throw new Error("Not connected");
        try {
            let W = new Headers((G = this._requestInit) === null || G === void 0 ? void 0 : G.headers);
            W.set("content-type", "application/json");
            let B = {
                ...this._requestInit,
                method: "POST",
                headers: W,
                body: JSON.stringify(I),
                signal: (Z = this._abortController) === null || Z === void 0 ? void 0 : Z.signal
            }, w = await fetch(this._endpoint, B);
            if (!w.ok) {
                let V = await w.text().catch(() => null);
                throw new Error(`Error POSTing to endpoint (HTTP ${w.status}): ${V}`);
            }
        } catch (W) {
            throw (d = this.onerror) === null || d === void 0 || d.call(this, W), 
            W;
        }
    }
}

var S5 = A1(u1(), 1);

var _P2 = "", HP2 = "";

var Xv3 = e.object({}).passthrough(), DP2 = {
    async isEnabled() {
        return !0;
    },
    isReadOnly() {
        return !1;
    },
    name: "mcp",
    async description() {
        return HP2;
    },
    async prompt() {
        return _P2;
    },
    inputSchema: Xv3,
    async *call() {
        yield {
            type: "result",
            data: "",
            resultForAssistant: ""
        };
    },
    needsPermissions() {
        return !0;
    },
    renderToolUseMessage(I) {
        return Object.entries(I).map(([ G, Z ]) => `${G}: ${JSON.stringify(Z)}`).join(", ");
    },
    userFacingName: () => "mcp",
    renderToolUseRejectedMessage() {
        return S5.createElement(E5, null);
    },
    renderToolResultMessage(I, {
        verbose: G
    }) {
        if (Array.isArray(I)) return S5.createElement(p, {
            flexDirection: "column"
        }, I.map((d, W) => {
            if (d.type === "image") return S5.createElement(p, {
                key: W,
                justifyContent: "space-between",
                overflowX: "hidden",
                width: "100%"
            }, S5.createElement(p, {
                flexDirection: "row"
            }, S5.createElement(O, null, "  ⎿  "), S5.createElement(O, null, "[Image]")));
            let B = d.text.split(`
`).length;
            return S5.createElement($E, {
                key: W,
                content: d.text,
                lines: B,
                verbose: G
            });
        }));
        if (!I) return S5.createElement(p, {
            justifyContent: "space-between",
            overflowX: "hidden",
            width: "100%"
        }, S5.createElement(p, {
            flexDirection: "row"
        }, S5.createElement(O, null, "  ⎿  "), S5.createElement(O, {
            color: e1().secondaryText
        }, "(No content)")));
        let Z = I.split(`
`).length;
        return S5.createElement($E, {
            content: I,
            lines: Z,
            verbose: G
        });
    },
    renderResultForAssistant(I) {
        return I;
    }
};

function N01(I) {
    let G = {};
    if (I) for (let Z of I) {
        let [ d, ...W ] = Z.split("=");
        if (!d || W.length === 0) throw new Error(`Invalid environment variable format: ${Z}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`);
        G[d] = W.join("=");
    }
    return G;
}

var Yv3 = [ "project", "global" ];

function q01(I) {
    if (!I) return "project";
    let G = Yv3;
    if (!G.includes(I)) throw new Error(`Invalid scope: ${I}. Must be one of: ${G.join(", ")}`);
    return I;
}

function uT(I, G, Z = "project") {
    if (Z === "mcprc") {
        let d = zP2(u0(), ".mcprc"), W = {};
        if (FP2(d)) try {
            let B = JP2(d, "utf-8"), w = Hw(B);
            if (w && typeof w === "object") W = w;
        } catch {}
        W[I] = G;
        try {
            KP2(d, JSON.stringify(W, null, 2), "utf-8");
        } catch (B) {
            throw new Error(`Failed to write to .mcprc: ${B}`);
        }
    } else if (Z === "global") {
        let d = Q2();
        if (!d.mcpServers) d.mcpServers = {};
        d.mcpServers[I] = G, i4(d);
    } else {
        let d = E4();
        if (!d.mcpServers) d.mcpServers = {};
        d.mcpServers[I] = G, h3(d);
    }
}

function QP2(I, G, Z = "project") {
    if (I.match(/[^a-zA-Z0-9_-]/)) throw new Error(`Invalid name ${I}. Names can only contain letters, numbers, hyphens, and underscores.`);
    if (yT(I)) throw new Error(`A server with the name ${I} already exists.`);
    let d = Hw(G);
    if (!d) throw new Error("Invalid JSON");
    let W = Cf1.safeParse(d);
    if (!W.success) {
        let B = W.error.errors.map(w => `${w.path.join(".")}: ${w.message}`).join(", ");
        throw new Error(`Invalid configuration: ${B}`);
    }
    uT(I, W.data, Z);
}

function NP2(I, G = "project") {
    if (G === "mcprc") {
        let Z = zP2(u0(), ".mcprc");
        if (!FP2(Z)) throw new Error("No .mcprc file found in this directory");
        try {
            let d = JP2(Z, "utf-8"), W = Hw(d);
            if (!W || typeof W !== "object" || !W[I]) throw new Error(`No MCP server found with name: ${I} in .mcprc`);
            delete W[I], KP2(Z, JSON.stringify(W, null, 2), "utf-8");
        } catch (d) {
            if (d instanceof Error) throw d;
            throw new Error(`Failed to remove from .mcprc: ${d}`);
        }
    } else if (G === "global") {
        let Z = Q2();
        if (!Z.mcpServers?.[I]) throw new Error(`No global MCP server found with name: ${I}`);
        delete Z.mcpServers[I], i4(Z);
    } else {
        let Z = E4();
        if (!Z.mcpServers?.[I]) throw new Error(`No local MCP server found with name: ${I}`);
        delete Z.mcpServers[I], h3(Z);
    }
}

function qP2() {
    let I = Q2(), G = aS(), Z = E4();
    return {
        ...I.mcpServers ?? {},
        ...G ?? {},
        ...Z.mcpServers ?? {}
    };
}

function yT(I) {
    let G = E4(), Z = aS(), d = Q2();
    if (G.mcpServers?.[I]) return {
        ...G.mcpServers[I],
        scope: "project"
    };
    if (Z?.[I]) return {
        ...Z[I],
        scope: "mcprc"
    };
    if (d.mcpServers?.[I]) return {
        ...d.mcpServers[I],
        scope: "global"
    };
    return;
}

async function Av3(I, G) {
    let Z = G.type === "sse" ? new yf1(new URL(G.url)) : new gf1({
        command: G.command,
        args: G.args,
        env: {
            ...process.env,
            ...G.env
        },
        stderr: "pipe"
    }), d = new qf1({
        name: "claude",
        version: "0.1.0"
    }, {
        capabilities: {}
    }), W = 5e3, B = d.connect(Z), w = new Promise((V, C) => {
        let X = setTimeout(() => {
            C(new Error(`Connection to MCP server "${I}" timed out after 5000ms`));
        }, 5e3);
        B.then(() => clearTimeout(X), () => clearTimeout(X));
    });
    if (await Promise.race([ B, w ]), G.type === "stdio") Z.stderr?.on("data", V => {
        let C = V.toString().trim();
        if (C) iK(I, `Server stderr: ${C}`);
    });
    return d;
}

function gP2(I) {
    let G = E4();
    if (G.approvedMcprcServers?.includes(I)) return "approved";
    if (G.rejectedMcprcServers?.includes(I)) return "rejected";
    return "pending";
}

var Of1 = x2(async () => {
    let I = Q2().mcpServers ?? {}, G = aS(), Z = E4().mcpServers ?? {}, d = f51(G, (B, w) => gP2(w) === "approved"), W = {
        ...I,
        ...d,
        ...Z
    };
    return await Promise.all(Object.entries(W).map(async ([ B, w ]) => {
        try {
            let V = await Av3(B, w);
            return B0("tengu_mcp_server_connection_succeeded", {}), {
                name: B,
                client: V,
                type: "connected"
            };
        } catch (V) {
            return B0("tengu_mcp_server_connection_failed", {}), iK(B, `Connection failed: ${V instanceof Error ? V.message : String(V)}`), 
            {
                name: B,
                type: "failed"
            };
        }
    }));
});

async function UP2(I, G, Z) {
    let d = await Of1();
    return (await Promise.allSettled(d.map(async B => {
        if (B.type === "failed") return null;
        try {
            if (!(await B.client.getServerCapabilities())?.[Z]) return null;
            return {
                client: B,
                result: await B.client.request(I, G)
            };
        } catch (w) {
            if (B.type === "connected") iK(B.name, `Failed to request '${I.method}': ${w instanceof Error ? w.message : String(w)}`);
            return null;
        }
    }))).filter(B => B.status === "fulfilled").map(B => B.value).filter(B => B !== null);
}

var g01 = x2(async () => {
    return (await UP2({
        method: "tools/list"
    }, RT, "tools")).flatMap(({
        client: G,
        result: {
            tools: Z
        }
    }) => Z.map(d => ({
        ...DP2,
        name: "mcp__" + G.name + "__" + d.name,
        async description() {
            return d.description ?? "";
        },
        async prompt() {
            return d.description ?? "";
        },
        inputJSONSchema: d.inputSchema,
        async *call(W) {
            let B = await _v3({
                client: G,
                tool: d.name,
                args: W
            });
            yield {
                type: "result",
                data: B,
                resultForAssistant: B
            };
        },
        userFacingName() {
            return `${G.name}:${d.name} (MCP)`;
        }
    })));
});

async function _v3({
    client: {
        client: I,
        name: G
    },
    tool: Z,
    args: d
}) {
    let W = await I.callTool({
        name: Z,
        arguments: d
    }, bE);
    if ("isError" in W && W.isError) {
        let w = `Error calling tool ${Z}: ${W.error}`;
        throw iK(G, w), Error(w);
    }
    if ("toolResult" in W) return String(W.toolResult);
    if ("content" in W && Array.isArray(W.content)) return W.content.map(w => {
        if (w.type === "image") return {
            type: "image",
            source: {
                type: "base64",
                data: String(w.data),
                media_type: w.mimeType
            }
        };
        return w;
    });
    let B = `Unexpected response format from tool ${Z}`;
    throw iK(G, B), Error(B);
}

var fP2 = x2(async () => {
    return (await UP2({
        method: "prompts/list"
    }, fT, "prompts")).flatMap(({
        client: G,
        result: Z
    }) => Z.prompts?.map(d => {
        let W = Object.values(d.arguments ?? {}).map(B => B.name);
        return {
            type: "prompt",
            name: "mcp__" + G.name + "__" + d.name,
            description: d.description ?? "",
            isEnabled: !0,
            isHidden: !1,
            progressMessage: "running",
            userFacingName() {
                return `${G.name}:${d.name} (MCP)`;
            },
            argNames: W,
            async getPromptForCommand(B) {
                let w = B.split(" ");
                return await Hv3({
                    name: d.name,
                    client: G
                }, v51(W, w));
            }
        };
    }));
});

async function Hv3({
    name: I,
    client: G
}, Z) {
    try {
        return (await G.client.getPrompt({
            name: I,
            arguments: Z
        })).messages.map(W => ({
            role: W.role,
            content: [ W.content.type === "text" ? {
                type: "text",
                text: W.content.text
            } : {
                type: "image",
                source: {
                    data: String(W.content.data),
                    media_type: W.content.mimeType,
                    type: "base64"
                }
            } ]
        }));
    } catch (d) {
        throw iK(G.name, `Error running command '${I}': ${d instanceof Error ? d.message : String(d)}`), 
        d;
    }
}

import {
    readFile as Dv3
} from "fs/promises";

import {
    dirname as mf1,
    basename as Fv3,
    join as Jv3
} from "path";

import {
    homedir as Kv3
} from "os";

var zv3 = "user", Qv3 = "project", RP2 = x2(async () => {
    let I = u0(), G = Kv3();
    try {
        let Z = new AbortController(), d = setTimeout(() => Z.abort(), 3e3);
        try {
            let W = Date.now(), B = Jv3(G, ".claude", "commands"), [ w, V ] = await Promise.all([ oY([ "--files", "--hidden", "--glob", "**/.claude/commands/*.md" ], I, Z.signal), oY([ "--files", "--glob", "*.md" ], B, Z.signal).catch(() => []) ]), C = [ ...w, ...V ], X = Date.now() - W;
            return B0("tengu_command_dir_search", {
                durationMs: String(X),
                projectFilesFound: String(w.length),
                userFilesFound: String(V.length)
            }), C.map(Y => {
                let A = mf1(Y), D = Fv3(Y), J = mf1(A), K = mf1(J), z = K === I, Q = Y.startsWith(B), U = D.replace(/\.md$/, "");
                if (Q) U = `${zv3}:${U}`; else if (!z) {
                    let S = K.split("/");
                    U = `${S[S.length - 1]}:${U}`;
                }
                let M = Q ? U : `${Qv3}:${U}`;
                return {
                    type: "prompt",
                    name: M,
                    description: "Custom command",
                    isEnabled: !0,
                    isHidden: !1,
                    progressMessage: "running",
                    userFacingName() {
                        return M;
                    },
                    async getPromptForCommand(S) {
                        try {
                            let L = await Dv3(Y, "utf-8");
                            if (S) if (L.includes("$ARGUMENTS")) L = L.replace("$ARGUMENTS", S); else L = L + `

ARGUMENTS: ${S}`;
                            return [ {
                                role: "user",
                                content: [ {
                                    type: "text",
                                    text: L
                                } ]
                            } ];
                        } catch (L) {
                            return W0(`Error reading command file ${Y}: ${L}`), 
                            [ {
                                role: "user",
                                content: [ {
                                    type: "text",
                                    text: `Error loading command from ${Y}`
                                } ]
                            } ];
                        }
                    }
                };
            });
        } finally {
            clearTimeout(d);
        }
    } catch (Z) {
        return W0(Z), [];
    }
});

import {
    exit as Nv3
} from "process";

var qv3 = {
    type: "local",
    name: "exit",
    aliases: [ "quit" ],
    description: "Exit the REPL",
    isEnabled: !0,
    isHidden: !1,
    async call() {
        Nv3(0);
    },
    userFacingName() {
        return "exit";
    }
}, vP2 = qv3;

var gv3 = x2(() => [ NS2, vS2, MS2, $S2, uL2, vP2, OL2, mL2, rL2, oL2, FS2, Z01, tU, eL2, tL2, ..._n() ? [ aL2, nL2() ] : [], ...[] ]), EP2 = x2(async () => {
    return [ ...await fP2(), ...await RP2(), ...[], ...gv3() ].filter(I => I.isEnabled);
});

function MP2(I, G) {
    return G.some(Z => Z.userFacingName() === I || Z.aliases?.includes(I));
}

function U01(I, G) {
    let Z = G.find(d => d.userFacingName() === I || d.aliases?.includes(I));
    if (!Z) throw ReferenceError(`Command ${I} not found. Available commands: ${G.map(d => {
        let W = d.userFacingName();
        return d.aliases ? `${W} (aliases: ${d.aliases.join(", ")})` : W;
    }).join(", ")}`);
    return Z;
}

import {
    resolve as Uv3
} from "path";

var vN = A1(u1(), 1);

var w_ = A1(u1(), 1);

function f01({
    param: {
        text: I
    },
    addMargin: G
}) {
    let Z = Id(I, "bash-input");
    if (!Z) return null;
    return w_.createElement(p, {
        flexDirection: "column",
        marginTop: G ? 1 : 0,
        width: "100%"
    }, w_.createElement(p, null, w_.createElement(O, {
        color: e1().bashBorder
    }, "!"), w_.createElement(O, {
        color: e1().secondaryText
    }, " ", Z)));
}

function $P2(I, G) {
    return new Set([ ...I ].filter(Z => !G.has(Z)));
}

function Tf1(I, G) {
    return I.size > 0 && G.size > 0 && [ ...I ].some(Z => G.has(Z));
}

var IW = "[Request interrupted by user]", DV = "[Request interrupted by user for tool use]", pE = "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.", mT = "The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.", qT = "No response requested.", tD2 = new Set([ IW, DV, pE, mT, qT ]);

function SP2({
    content: I,
    surface: G,
    extra: Z
}) {
    return {
        type: "assistant",
        costUSD: 0,
        durationMs: 0,
        uuid: OT(),
        message: {
            id: OT(),
            model: "<synthetic>",
            role: "assistant",
            stop_reason: "stop_sequence",
            stop_sequence: "",
            type: "message",
            usage: {
                input_tokens: 0,
                output_tokens: 0,
                cache_creation_input_tokens: 0,
                cache_read_input_tokens: 0
            },
            content: I
        },
        surface: G,
        ...Z
    };
}

function K6({
    content: I,
    surface: G
}) {
    return SP2({
        content: typeof I === "string" ? [ {
            type: "text",
            text: I === "" ? FJ : I
        } ] : I,
        surface: G
    });
}

function LE({
    content: I,
    surface: G
}) {
    return SP2({
        content: [ {
            type: "text",
            text: I === "" ? FJ : I
        } ],
        surface: G,
        extra: {
            isApiErrorMessage: !0
        }
    });
}

function h9({
    content: I,
    surface: G,
    toolUseResult: Z
}) {
    return {
        type: "user",
        message: {
            role: "user",
            content: I
        },
        uuid: OT(),
        surface: G,
        toolUseResult: Z
    };
}

function o$2(I, G, Z, d, W, B, w) {
    return {
        type: "progress",
        content: d,
        normalizedMessages: W,
        parentMessageID: G,
        siblingToolUseIDs: Z,
        surface: "client",
        tools: B,
        toolUseID: I,
        uuid: OT(),
        isResolved: w
    };
}

function e$2(I) {
    return {
        type: "tool_result",
        content: pE,
        is_error: !0,
        tool_use_id: I
    };
}

async function R01(I, G, Z, d, W, B) {
    if (G === "bash") {
        B0("tengu_input_bash", {});
        let w = h9({
            content: `<bash-input>${I}</bash-input>`,
            surface: "both"
        });
        if (I.startsWith("cd ")) {
            let V = u0(), C = Uv3(V, I.slice(3));
            try {
                return await qC(C), [ w, K6({
                    content: `<bash-stdout>Changed directory to ${T0.bold(`${C}/`)}</bash-stdout>`,
                    surface: "both"
                }) ];
            } catch (X) {
                return W0(X), [ w, K6({
                    content: `<bash-stderr>cwd error: ${X instanceof Error ? X.message : String(X)}</bash-stderr>`,
                    surface: "both"
                }) ];
            }
        }
        Z({
            jsx: vN.createElement(p, {
                flexDirection: "column",
                marginTop: 1
            }, vN.createElement(f01, {
                addMargin: !1,
                param: {
                    text: `<bash-input>${I}</bash-input>`,
                    type: "text"
                }
            }), vN.createElement(e11, null)),
            shouldHidePromptInput: !1
        });
        try {
            let V = await j4.validateInput({
                command: I
            });
            if (!V.result) return [ w, K6({
                content: V.message,
                surface: "both"
            }) ];
            let {
                data: C
            } = await Z_(j4.call({
                command: I
            }, d));
            return [ w, K6({
                content: `<bash-stdout>${C.stdout}</bash-stdout><bash-stderr>${C.stderr}</bash-stderr>`,
                surface: "both"
            }) ];
        } catch (V) {
            if (V instanceof Iz) {
                if (V.interrupted) return [ w, K6({
                    content: IW,
                    surface: "both"
                }) ];
                return [ w, K6({
                    content: `<bash-stderr>Command failed: ${V.stderr}</bash-stderr>`,
                    surface: "both"
                }) ];
            }
            return [ w, K6({
                content: `<bash-stderr>Command failed: ${V instanceof Error ? V.message : String(V)}</bash-stderr>`,
                surface: "both"
            }) ];
        } finally {
            Z(null);
        }
    }
    if (I.startsWith("/")) {
        let w = I.slice(1).split(" "), V = w[0];
        if (w.length > 1 && w[1] === "(MCP)") V = V + " (MCP)";
        if (!V) return B0("tengu_input_slash_missing", {}), [ K6({
            content: "Commands are in the form `/command [args]`",
            surface: "both"
        }) ];
        if (!MP2(V, d.options.commands)) return B0("tengu_input_prompt", {}), [ h9({
            content: I,
            surface: "both"
        }) ];
        let C = I.slice(V.length + 2), X = await fv3(V, C, Z, d);
        if (X.length === 0) return B0("tengu_input_command", {
            input: V
        }), [];
        if (X.length === 2 && X[0].type === "user" && X[1].type === "assistant" && typeof X[1].message.content === "string" && X[1].message.content.startsWith("Unknown command:")) return B0("tengu_input_slash_invalid", {
            input: V
        }), X;
        if (X.length === 2) return B0("tengu_input_command", {
            input: V
        }), X;
        return B0("tengu_input_command", {
            input: V
        }), X;
    }
    if (B0("tengu_input_prompt", {}), W) return [ h9({
        content: [ {
            type: "image",
            source: {
                type: "base64",
                media_type: "image/png",
                data: W
            }
        }, {
            type: "text",
            text: I
        } ],
        surface: "both"
    }) ];
    return [ h9({
        content: I,
        surface: "both"
    }) ];
}

async function fv3(I, G, Z, d) {
    try {
        let W = U01(I, d.options.commands);
        switch (W.type) {
          case "local-jsx":
            return new Promise(B => {
                W.call(w => {
                    Z(null), B([ h9({
                        content: `<command-name>${W.userFacingName()}</command-name>
          <command-message>${W.userFacingName()}</command-message>
          <command-args>${G}</command-args>`,
                        surface: "both"
                    }), w ? K6({
                        content: w,
                        surface: "both"
                    }) : K6({
                        content: qT,
                        surface: "both"
                    }) ]);
                }, d).then(w => {
                    Z({
                        jsx: w,
                        shouldHidePromptInput: !0
                    });
                });
            });

          case "local":
            {
                let B = h9({
                    content: `<command-name>${W.userFacingName()}</command-name>
        <command-message>${W.userFacingName()}</command-message>
        <command-args>${G}</command-args>`,
                    surface: "both"
                });
                try {
                    let w = await W.call(G, d);
                    return [ B, K6({
                        content: `<local-command-stdout>${w}</local-command-stdout>`,
                        surface: "both"
                    }) ];
                } catch (w) {
                    return W0(w), [ B, K6({
                        content: `<local-command-stderr>${String(w)}</local-command-stderr>`,
                        surface: "both"
                    }) ];
                }
            }

          case "prompt":
            return (await W.getPromptForCommand(G)).map(w => {
                if (typeof w.content === "string") return h9({
                    content: `<command-message>${W.userFacingName()} is ${W.progressMessage}…</command-message>
                    <command-name>${W.userFacingName()}</command-name>
                    <command-args>${G}</command-args>
                    <command-contents>${JSON.stringify(w.content, null, 2)}</command-contents>`,
                    surface: "both"
                });
                return h9({
                    content: w.content.map(V => {
                        switch (V.type) {
                          case "text":
                            return {
                                ...V,
                                text: `
                        <command-message>${W.userFacingName()} is ${W.progressMessage}…</command-message>
                        <command-name>${W.userFacingName()}</command-name>
                        <command-args>${G}</command-args>
                        <command-contents>${JSON.stringify(V, null, 2)}</command-contents>
                      `
                            };

                          default:
                            return V;
                        }
                    }),
                    surface: "both"
                });
            });
        }
    } catch (W) {
        if (W instanceof P61) return [ K6({
            content: W.message,
            surface: "both"
        }) ];
        throw W;
    }
}

function Id(I, G) {
    if (!I.trim() || !G.trim()) return null;
    let Z = G.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), d = new RegExp(`<${Z}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${Z}>`, "gi"), W, B = 0, w = 0, V = new RegExp(`<${Z}(?:\\s+[^>]*?)?>`, "gi"), C = new RegExp(`<\\/${Z}>`, "gi");
    while ((W = d.exec(I)) !== null) {
        let X = W[1], Y = I.slice(w, W.index);
        B = 0, V.lastIndex = 0;
        while (V.exec(Y) !== null) B++;
        C.lastIndex = 0;
        while (C.exec(Y) !== null) B--;
        if (B === 0 && X) return X;
        w = W.index + W[0].length;
    }
    return null;
}

function v01(I) {
    if (I.type === "progress") return !0;
    if (typeof I.message.content === "string") return I.message.content.trim().length > 0;
    if (I.message.content.length === 0) return !1;
    if (I.message.content.length > 1) return !0;
    if (I.message.content[0].type !== "text") return !0;
    return I.message.content[0].text.trim().length > 0 && I.message.content[0].text !== FJ && I.message.content[0].text !== DV;
}

function Zd(I) {
    return I.flatMap(G => {
        if (G.type === "progress") return [ G ];
        if (typeof G.message.content === "string") return [ G ];
        return G.message.content.map(Z => {
            switch (G.type) {
              case "assistant":
                return {
                    type: "assistant",
                    uuid: OT(),
                    message: {
                        ...G.message,
                        content: [ Z ]
                    },
                    costUSD: G.costUSD / G.message.content.length,
                    durationMs: G.durationMs,
                    surface: G.surface
                };

              case "user":
                return h9({
                    content: [ Z ],
                    surface: G.surface,
                    toolUseResult: G.toolUseResult
                });
            }
        });
    });
}

function Rv3(I) {
    return I.type === "assistant" && "costUSD" in I && I.message.content.some(G => G.type === "tool_use");
}

function gS2(I) {
    return I.type === "user" && (Array.isArray(I.message.content) && I.message.content[0]?.type === "tool_result" || Boolean(I.toolUseResult));
}

function LP2(I) {
    let G = [], Z = [];
    for (let d of I) {
        if (Rv3(d)) Z.push(d);
        if (d.type === "progress") {
            let W = G.find(w => w.type === "progress" && w.toolUseID === d.toolUseID);
            if (W) {
                G[G.indexOf(W)] = d;
                continue;
            }
            let B = Z.find(w => w.message.id === d.parentMessageID);
            if (B) {
                let w = G.indexOf(B) + 1, V = G[w];
                while (V?.type === "progress" && V.parentMessageID === d.parentMessageID) w++, 
                V = G[w];
                G.splice(w, 0, d);
                continue;
            }
        }
        if (d.type === "user" && Array.isArray(d.message.content) && d.message.content[0]?.type === "tool_result") {
            let W = d.message.content[0]?.tool_use_id, B = G.find(V => V.type === "progress" && V.toolUseID === W);
            if (B) {
                G.splice(G.indexOf(B) + 1, 0, d);
                continue;
            }
            let w = Z.find(V => V.message.content[0]?.id === W);
            if (w) {
                G.splice(G.indexOf(w) + 1, 0, d);
                continue;
            }
        } else G.push(d);
    }
    return G;
}

var PP2 = x2(I => Object.fromEntries(I.flatMap(G => G.type === "user" && G.message.content[0]?.type === "tool_result" ? [ [ G.message.content[0].tool_use_id, G.message.content[0].is_error ?? !1 ] ] : [])));

function E01(I) {
    let G = PP2(I), Z = vv3(I);
    return $P2(Z, new Set(Object.keys(G)));
}

var vv3 = x2(I => new Set(I.filter(G => G.type === "assistant" && Array.isArray(G.message.content) && G.message.content[0]?.type === "tool_use").map(G => G.message.content[0].id)));

function uP2(I) {
    let G = E01(I), Z = new Set(I.filter(d => d.type === "progress").map(d => d.toolUseID));
    return new Set(I.filter(d => {
        if (d.type !== "assistant") return !1;
        if (d.message.content[0]?.type !== "tool_use") return !1;
        let W = d.message.content[0].id;
        if (W === G.values().next().value) return !0;
        let B = Ev3(G);
        if (W === B) return !0;
        if (Z.has(W) && G.has(W)) return !0;
        return !1;
    }).map(d => d.message.content[0].id));
}

function Ev3(I) {
    return Array.from(I).find(G => G.startsWith("mapr_"));
}

function yP2(I) {
    let G = PP2(I);
    return I.filter(Z => Z.type === "assistant" && Array.isArray(Z.message.content) && Z.message.content[0]?.type === "tool_use" && Z.message.content[0]?.id in G && G[Z.message.content[0]?.id]);
}

function yE(I) {
    let G = [];
    return I.filter(Z => Z.type !== "progress").filter(Z => Z.surface !== "client").forEach(Z => {
        switch (Z.type) {
          case "user":
            {
                if (!Array.isArray(Z.message.content) || Z.message.content[0]?.type !== "tool_result") {
                    G.push(Z);
                    return;
                }
                let d = UY(G);
                if (!d || d?.type === "assistant" || !Array.isArray(d.message.content) || d.message.content[0]?.type !== "tool_result") {
                    G.push(Z);
                    return;
                }
                G[G.indexOf(d)] = {
                    ...d,
                    message: {
                        ...d.message,
                        content: [ ...d.message.content, ...Z.message.content ]
                    }
                };
                return;
            }

          case "assistant":
            G.push(Z);
            return;
        }
    }), G;
}

function $11(I) {
    let G = I.filter(Z => Z.type !== "text" || Z.text.trim().length > 0);
    if (G.length === 0) return [ {
        type: "text",
        text: FJ
    } ];
    return G;
}

function M01(I) {
    return bf1(I).trim() === "" || I.trim() === FJ;
}

var Mv3 = [ "commit_analysis", "context", "function_analysis", "pr_analysis" ];

function bf1(I) {
    let G = new RegExp(`<(${Mv3.join("|")})>.*?</\\1>
?`, "gs");
    return I.replace(G, "").trim();
}

function jf1(I) {
    switch (I.type) {
      case "assistant":
        if (I.message.content[0]?.type !== "tool_use") return null;
        return I.message.content[0].id;

      case "user":
        if (I.message.content[0]?.type !== "tool_result") return null;
        return I.message.content[0].tool_use_id;

      case "progress":
        return I.toolUseID;
    }
}

function iE(I) {
    for (let G = I.length - 1; G >= 0; G--) {
        let Z = I[G];
        if (Z && Z.type === "assistant") return Z.message.id;
    }
    return;
}

function h11(I) {
    let G = Zd(I), Z = E01(G);
    return G.filter((W, B) => {
        if (W.type === "assistant" && W.message.content[0]?.type === "tool_use" && Z.has(W.message.content[0].id)) return !1;
        return !0;
    });
}

function US2(I) {
    if (I.type !== "user") return !1;
    return I.message.content !== void 0 && typeof I.message.content === "string";
}

var TT = A1(u1(), 1);

function OP2() {
    return TT.createElement(O, null, "  ⎿  ", TT.createElement(O, {
        color: e1().error
    }, "Interrupted by user"));
}

var VZ = A1(u1(), 1);

var lf1 = A1(u1(), 1);

function $01() {
    return lf1.createElement(O, {
        color: e1().error
    }, "Interrupted by user");
}

var bT = A1(u1(), 1);

function Bd({
    children: I
}) {
    return bT.createElement(p, {
        flexDirection: "row",
        height: 1,
        overflow: "hidden"
    }, bT.createElement(O, null, "  ", "⎿  "), I);
}

var kf1 = 10;

function mP2({
    param: I,
    verbose: G
}) {
    let Z = typeof I.content === "string" ? I.content.trim() : "Error";
    if (Z.startsWith(DV)) return VZ.createElement(Bd, null, VZ.createElement($01, null));
    return VZ.createElement(p, {
        flexDirection: "row",
        width: "100%"
    }, VZ.createElement(O, null, "  ⎿  "), VZ.createElement(p, {
        flexDirection: "column"
    }, VZ.createElement(O, {
        color: e1().error
    }, G ? Z : Z.split(`
`).slice(0, kf1).join(`
`) || ""), !G && Z.split(`
`).length > kf1 && VZ.createElement(O, {
        color: e1().secondaryText
    }, "... (+", Z.split(`
`).length - kf1, " lines)")));
}

var xf1 = A1(u1(), 1);

var bP2 = A1(u1(), 1);

var QJ = A1(u1(), 1);

var jT = A1(u1(), 1);

function zJ({
    costUSD: I,
    durationMs: G,
    debug: Z
}) {
    if (!Z) return null;
    let d = (G / 1e3).toFixed(1);
    return jT.createElement(p, {
        flexDirection: "column",
        minWidth: 23,
        width: 23
    }, jT.createElement(O, {
        dimColor: !0
    }, "Cost: $", I.toFixed(4), " (", d, "s)"));
}

import {
    isAbsolute as $v3,
    relative as Sv3,
    resolve as Lv3
} from "path";

var Pv3 = e.strictObject({
    pattern: e.string().describe("The glob pattern to match files against"),
    path: e.string().optional().describe("The directory to search in. Defaults to the current working directory.")
}), W7 = {
    name: K11,
    async description() {
        return tg1;
    },
    userFacingName() {
        return "Search";
    },
    async isEnabled() {
        return !0;
    },
    inputSchema: Pv3,
    isReadOnly() {
        return !0;
    },
    getPath({
        path: I
    }) {
        return I || u0();
    },
    needsPermissions(I) {
        return !PX(W7.getPath(I));
    },
    async prompt() {
        return tg1;
    },
    renderToolUseMessage({
        pattern: I,
        path: G
    }, {
        verbose: Z
    }) {
        let d = G ? $v3(G) ? G : Lv3(u0(), G) : void 0, W = d ? Sv3(u0(), d) : void 0;
        return `pattern: "${I}"${W || Z ? `, path: "${Z ? d : W}"` : ""}`;
    },
    renderToolUseRejectedMessage() {
        return QJ.default.createElement(E5, null);
    },
    renderToolResultMessage(I) {
        if (typeof I === "string") I = JSON.parse(I);
        return QJ.default.createElement(p, {
            justifyContent: "space-between",
            width: "100%"
        }, QJ.default.createElement(p, {
            flexDirection: "row"
        }, QJ.default.createElement(O, null, "  ⎿  Found "), QJ.default.createElement(O, {
            bold: !0
        }, I.numFiles, " "), QJ.default.createElement(O, null, I.numFiles === 0 || I.numFiles > 1 ? "files" : "file")), QJ.default.createElement(zJ, {
            costUSD: 0,
            durationMs: I.durationMs,
            debug: !1
        }));
    },
    async *call(I, {
        abortController: G
    }) {
        let Z = Date.now(), {
            files: d,
            truncated: W
        } = await bd0(I.pattern, W7.getPath(I), {
            limit: 100,
            offset: 0
        }, G.signal), B = {
            filenames: d,
            durationMs: Date.now() - Z,
            numFiles: d.length,
            truncated: W
        };
        yield {
            type: "result",
            resultForAssistant: this.renderResultForAssistant(B),
            data: B
        };
    },
    renderResultForAssistant(I) {
        let G = I.filenames.join(`
`);
        if (I.filenames.length === 0) G = "No files found"; else if (I.truncated) G += `
(Results are truncated. Consider using a more specific path or pattern.)`;
        return G;
    }
};

import {
    stat as uv3
} from "fs/promises";

var NJ = A1(u1(), 1);

var yv3 = e.strictObject({
    pattern: e.string().describe("The regular expression pattern to search for in file contents"),
    path: e.string().optional().describe("The directory to search in. Defaults to the current working directory."),
    include: e.string().optional().describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")')
}), TP2 = 100, CZ = {
    name: z11,
    async description() {
        return IU1;
    },
    userFacingName() {
        return "Search";
    },
    async isEnabled() {
        return !0;
    },
    inputSchema: yv3,
    isReadOnly() {
        return !0;
    },
    getPath({
        path: I
    }) {
        return I || u0();
    },
    needsPermissions({
        path: I
    }) {
        return !PX(I || u0());
    },
    async prompt() {
        return IU1;
    },
    renderToolUseMessage({
        pattern: I,
        path: G,
        include: Z
    }, {
        verbose: d
    }) {
        let {
            absolutePath: W,
            relativePath: B
        } = cd0(G);
        return `pattern: "${I}"${B || d ? `, path: "${d ? W : B}"` : ""}${Z ? `, include: "${Z}"` : ""}`;
    },
    renderToolUseRejectedMessage() {
        return NJ.default.createElement(E5, null);
    },
    renderToolResultMessage(I) {
        if (typeof I === "string") I = I;
        return NJ.default.createElement(p, {
            justifyContent: "space-between",
            width: "100%"
        }, NJ.default.createElement(p, {
            flexDirection: "row"
        }, NJ.default.createElement(O, null, "  ⎿  Found "), NJ.default.createElement(O, {
            bold: !0
        }, I.numFiles, " "), NJ.default.createElement(O, null, I.numFiles === 0 || I.numFiles > 1 ? "files" : "file")), NJ.default.createElement(zJ, {
            costUSD: 0,
            durationMs: I.durationMs,
            debug: !1
        }));
    },
    renderResultForAssistant({
        numFiles: I,
        filenames: G
    }) {
        if (I === 0) return "No files found";
        let Z = `Found ${I} file${I === 1 ? "" : "s"}
${G.slice(0, TP2).join(`
`)}`;
        if (I > TP2) Z += `
(Results are truncated. Consider using a more specific path or pattern.)`;
        return Z;
    },
    async *call({
        pattern: I,
        path: G,
        include: Z
    }, {
        abortController: d
    }) {
        let W = Date.now(), B = mW1(G) || u0(), w = [ "-Uli", "--multiline-dotall", I ];
        if (Z) w.push("--glob", Z);
        let V = E4();
        if (V.ignorePatterns && V.ignorePatterns.length > 0) for (let D of V.ignorePatterns) w.push("--glob", `!${D}`);
        let C = await oY(w, B, d.signal), X = await Promise.all(C.map(D => uv3(D))), Y = C.map((D, J) => [ D, X[J] ]).sort((D, J) => {
            let K = (J[1].mtimeMs ?? 0) - (D[1].mtimeMs ?? 0);
            if (K === 0) return D[0].localeCompare(J[0]);
            return K;
        }).map(D => D[0]), A = {
            filenames: Y,
            durationMs: Date.now() - W,
            numFiles: Y.length
        };
        yield {
            type: "result",
            resultForAssistant: this.renderResultForAssistant(A),
            data: A
        };
    }
};

function Ov3(I, G) {
    let Z = null;
    for (let d of G) {
        if (d.type !== "assistant" || !Array.isArray(d.message.content)) continue;
        for (let W of d.message.content) if (W.type === "tool_use" && W.id === I) Z = W;
    }
    return Z;
}

function S01(I, G, Z) {
    return bP2.useMemo(() => {
        let d = Ov3(I, Z);
        if (!d) throw new ReferenceError(`Tool use not found for tool_use_id ${I}`);
        let W = [ ...G, W7, CZ ].find(B => B.name === d.name);
        if (W === W7 || W === CZ) B0("tengu_legacy_tool_lookup", {});
        if (!W) throw new ReferenceError(`Tool not found for ${d.name}`);
        return {
            tool: W,
            toolUse: d
        };
    }, [ I, Z, G ]);
}

function jP2({
    toolUseID: I,
    tools: G,
    messages: Z,
    verbose: d
}) {
    let {
        columns: W
    } = Q5(), {
        tool: B,
        toolUse: w
    } = S01(I, G, Z), V = B.inputSchema.safeParse(w.input);
    if (V.success) return B.renderToolUseRejectedMessage(V.data, {
        columns: W,
        verbose: d
    });
    return xf1.createElement(E5, null);
}

var hf1 = A1(u1(), 1);

function lP2({
    param: I,
    message: G,
    messages: Z,
    tools: d,
    verbose: W,
    width: B
}) {
    let {
        tool: w
    } = S01(I.tool_use_id, d, Z);
    if (!G.toolUseResult) return null;
    return hf1.createElement(p, {
        flexDirection: "column",
        width: B
    }, w.renderToolResultMessage?.(G.toolUseResult.data, {
        verbose: W
    }));
}

function kP2({
    param: I,
    message: G,
    messages: Z,
    tools: d,
    verbose: W,
    width: B
}) {
    if (I.content === pE) return V_.createElement(OP2, null);
    if (I.content === mT) return V_.createElement(jP2, {
        toolUseID: I.tool_use_id,
        tools: d,
        messages: Z,
        verbose: W
    });
    if (I.is_error) return V_.createElement(mP2, {
        param: I,
        verbose: W
    });
    return V_.createElement(lP2, {
        param: I,
        message: G,
        messages: Z,
        tools: d,
        verbose: W,
        width: B
    });
}

var SB = A1(u1(), 1);

var P01 = A1(u1(), 1);

var lT = A1(u1(), 1);

function L01(I, G) {
    let Z = lT.useRef(I);
    lT.useEffect(() => {
        Z.current = I;
    }, [ I ]), lT.useEffect(() => {
        function d() {
            Z.current();
        }
        let W = setInterval(d, G);
        return () => clearInterval(W);
    }, [ G ]);
}

var nE = P2.platform === "macos" ? "⏺" : "●";

function xP2({
    isError: I,
    isUnresolved: G,
    shouldAnimate: Z
}) {
    let [ d, W ] = P01.default.useState(!0);
    L01(() => {
        if (!Z) return;
        W(w => !w);
    }, 600);
    let B = G ? e1().secondaryText : I ? e1().error : e1().success;
    return P01.default.createElement(p, {
        minWidth: 2
    }, P01.default.createElement(O, {
        color: B
    }, d ? nE : "  "));
}

function hP2({
    param: I,
    costUSD: G,
    durationMs: Z,
    addMargin: d,
    tools: W,
    debug: B,
    verbose: w,
    erroredToolUseIDs: V,
    inProgressToolUseIDs: C,
    unresolvedToolUseIDs: X,
    shouldAnimate: Y,
    shouldShowDot: A
}) {
    let D = W.find(U => U.name === I.name);
    if (!D) return W0(`Tool ${I.name} not found`), null;
    let J = !C.has(I.id) && X.has(I.id), K = J ? e1().secondaryText : void 0, z = D.userFacingName(I.input), Q = mv3(D, I.input, {
        verbose: w
    });
    return SB.default.createElement(p, {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: d ? 1 : 0,
        width: "100%"
    }, SB.default.createElement(p, null, SB.default.createElement(p, {
        flexWrap: "nowrap",
        minWidth: z.length + (A ? 2 : 0)
    }, A && (J ? SB.default.createElement(p, {
        minWidth: 2
    }, SB.default.createElement(O, {
        color: K
    }, nE)) : SB.default.createElement(xP2, {
        shouldAnimate: Y,
        isUnresolved: X.has(I.id),
        isError: V.has(I.id)
    })), SB.default.createElement(O, {
        color: K,
        bold: !J
    }, z)), Q != null && SB.default.createElement(p, {
        flexWrap: "nowrap"
    }, SB.default.createElement(O, {
        color: K
    }, "(", Q, ")"), SB.default.createElement(O, {
        color: K
    }, "…"))), SB.default.createElement(zJ, {
        costUSD: G,
        durationMs: Z,
        debug: B
    }));
}

function mv3(I, G, {
    verbose: Z
}) {
    try {
        if (Object.keys(G).length < 1) return null;
        let d = I.renderToolUseMessage(G, {
            verbose: Z
        });
        if (!d) return null;
        return d;
    } catch (d) {
        return W0(`Error rendering tool use message for ${I.name}: ${d}`), null;
    }
}

var m8 = A1(u1(), 1);

var cf1 = A1(u1(), 1);

function cP2({
    content: I,
    verbose: G
}) {
    let Z = Id(I, "bash-stdout") ?? "", d = Id(I, "bash-stderr") ?? "", W = Z.split(`
`).length, B = d.split(`
`).length;
    return cf1.createElement(g11, {
        content: {
            stdout: Z,
            stdoutLines: W,
            stderr: d,
            stderrLines: B
        },
        verbose: !!G
    });
}

var dW = A1(u1(), 1);

function iP2({
    content: I
}) {
    let G = Id(I, "local-command-stdout"), Z = Id(I, "local-command-stderr");
    if (!G && !Z) return [];
    let d = e1(), W = [ pP2(G?.trim(), d.text), pP2(Z?.trim(), d.error) ].filter(Boolean);
    if (W.length === 0) W = [ dW.createElement(O, {
        key: "0"
    }, "(No output)") ];
    return [ dW.createElement(p, {
        key: "0",
        gap: 1
    }, dW.createElement(p, null, dW.createElement(O, {
        color: d.secondaryText
    }, "  ", "⎿ ")), W.map((B, w) => dW.createElement(p, {
        key: w,
        flexDirection: "column"
    }, B))) ];
}

function pP2(I, G) {
    if (!I) return null;
    return dW.createElement(O, {
        color: G
    }, I);
}

function if1() {
    return {
        async: !1,
        breaks: !1,
        extensions: null,
        gfm: !0,
        hooks: null,
        pedantic: !1,
        renderer: null,
        silent: !1,
        tokenizer: null,
        walkTokens: null
    };
}

var MN = if1();

function eP2(I) {
    MN = I;
}

var hT = {
    exec: () => null
};

function b3(I, G = "") {
    let Z = typeof I === "string" ? I : I.source, d = {
        replace: (W, B) => {
            let w = typeof B === "string" ? B : B.source;
            return w = w.replace(XZ.caret, "$1"), Z = Z.replace(W, w), d;
        },
        getRegex: () => {
            return new RegExp(Z, G);
        }
    };
    return d;
}

var XZ = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] /,
    listReplaceTask: /^\[[ xX]\] +/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: I => new RegExp(`^( {0,3}${I})((?:[	 ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: I => new RegExp(`^ {0,${Math.min(3, I - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
    hrRegex: I => new RegExp(`^ {0,${Math.min(3, I - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    fencesBeginRegex: I => new RegExp(`^ {0,${Math.min(3, I - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: I => new RegExp(`^ {0,${Math.min(3, I - 1)}}#`),
    htmlBeginRegex: I => new RegExp(`^ {0,${Math.min(3, I - 1)}}<(?:[a-z].*>|!--)`, "i")
}, Tv3 = /^(?:[ \t]*(?:\n|$))+/, bv3 = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, jv3 = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, nT = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, lv3 = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, tP2 = /(?:[*+-]|\d{1,9}[.)])/, Iu2 = b3(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, tP2).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), nf1 = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, kv3 = /^[^\n]+/, af1 = /(?!\s*\])(?:\\.|[^\[\]\\])+/, xv3 = b3(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", af1).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), hv3 = b3(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, tP2).getRegex(), O01 = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", rf1 = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, cv3 = b3("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", rf1).replace("tag", O01).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Gu2 = b3(nf1).replace("hr", nT).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", O01).getRegex(), pv3 = b3(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Gu2).getRegex(), sf1 = {
    blockquote: pv3,
    code: bv3,
    def: xv3,
    fences: jv3,
    heading: lv3,
    hr: nT,
    html: cv3,
    lheading: Iu2,
    list: hv3,
    newline: Tv3,
    paragraph: Gu2,
    table: hT,
    text: kv3
}, nP2 = b3("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", nT).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", O01).getRegex(), iv3 = {
    ...sf1,
    table: nP2,
    paragraph: b3(nf1).replace("hr", nT).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", nP2).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", O01).getRegex()
}, nv3 = {
    ...sf1,
    html: b3(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", rf1).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: hT,
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: b3(nf1).replace("hr", nT).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Iu2).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, av3 = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, rv3 = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Zu2 = /^( {2,}|\\)\n(?!\s*$)/, sv3 = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, m01 = /[\p{P}\p{S}]/u, of1 = /[\s\p{P}\p{S}]/u, du2 = /[^\s\p{P}\p{S}]/u, ov3 = b3(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, of1).getRegex(), Wu2 = /(?!~)[\p{P}\p{S}]/u, ev3 = /(?!~)[\s\p{P}\p{S}]/u, tv3 = /(?:[^\s\p{P}\p{S}]|~)/u, IE3 = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, Bu2 = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, GE3 = b3(Bu2, "u").replace(/punct/g, m01).getRegex(), ZE3 = b3(Bu2, "u").replace(/punct/g, Wu2).getRegex(), wu2 = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", dE3 = b3(wu2, "gu").replace(/notPunctSpace/g, du2).replace(/punctSpace/g, of1).replace(/punct/g, m01).getRegex(), WE3 = b3(wu2, "gu").replace(/notPunctSpace/g, tv3).replace(/punctSpace/g, ev3).replace(/punct/g, Wu2).getRegex(), BE3 = b3("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, du2).replace(/punctSpace/g, of1).replace(/punct/g, m01).getRegex(), wE3 = b3(/\\(punct)/, "gu").replace(/punct/g, m01).getRegex(), VE3 = b3(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), CE3 = b3(rf1).replace("(?:--\x3e|$)", "--\x3e").getRegex(), XE3 = b3("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", CE3).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), y01 = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, YE3 = b3(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", y01).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Vu2 = b3(/^!?\[(label)\]\[(ref)\]/).replace("label", y01).replace("ref", af1).getRegex(), Cu2 = b3(/^!?\[(ref)\](?:\[\])?/).replace("ref", af1).getRegex(), AE3 = b3("reflink|nolink(?!\\()", "g").replace("reflink", Vu2).replace("nolink", Cu2).getRegex(), ef1 = {
    _backpedal: hT,
    anyPunctuation: wE3,
    autolink: VE3,
    blockSkip: IE3,
    br: Zu2,
    code: rv3,
    del: hT,
    emStrongLDelim: GE3,
    emStrongRDelimAst: dE3,
    emStrongRDelimUnd: BE3,
    escape: av3,
    link: YE3,
    nolink: Cu2,
    punctuation: ov3,
    reflink: Vu2,
    reflinkSearch: AE3,
    tag: XE3,
    text: sv3,
    url: hT
}, _E3 = {
    ...ef1,
    link: b3(/^!?\[(label)\]\((.*?)\)/).replace("label", y01).getRegex(),
    reflink: b3(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", y01).getRegex()
}, pf1 = {
    ...ef1,
    emStrongRDelimAst: WE3,
    emStrongLDelim: ZE3,
    url: b3(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, HE3 = {
    ...pf1,
    br: b3(Zu2).replace("{2,}", "*").getRegex(),
    text: b3(pf1.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, u01 = {
    normal: sf1,
    gfm: iv3,
    pedantic: nv3
}, kT = {
    normal: ef1,
    gfm: pf1,
    breaks: HE3,
    pedantic: _E3
}, DE3 = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}, aP2 = I => DE3[I];

function lX(I, G) {
    if (G) {
        if (XZ.escapeTest.test(I)) return I.replace(XZ.escapeReplace, aP2);
    } else if (XZ.escapeTestNoEncode.test(I)) return I.replace(XZ.escapeReplaceNoEncode, aP2);
    return I;
}

function rP2(I) {
    try {
        I = encodeURI(I).replace(XZ.percentDecode, "%");
    } catch {
        return null;
    }
    return I;
}

function sP2(I, G) {
    let Z = I.replace(XZ.findPipe, (B, w, V) => {
        let C = !1, X = w;
        while (--X >= 0 && V[X] === "\\") C = !C;
        if (C) return "|"; else return " |";
    }), d = Z.split(XZ.splitPipe), W = 0;
    if (!d[0].trim()) d.shift();
    if (d.length > 0 && !d.at(-1)?.trim()) d.pop();
    if (G) if (d.length > G) d.splice(G); else while (d.length < G) d.push("");
    for (;W < d.length; W++) d[W] = d[W].trim().replace(XZ.slashPipe, "|");
    return d;
}

function xT(I, G, Z) {
    let d = I.length;
    if (d === 0) return "";
    let W = 0;
    while (W < d) if (I.charAt(d - W - 1) === G) W++; else break;
    return I.slice(0, d - W);
}

function FE3(I, G) {
    if (I.indexOf(G[1]) === -1) return -1;
    let Z = 0;
    for (let d = 0; d < I.length; d++) if (I[d] === "\\") d++; else if (I[d] === G[0]) Z++; else if (I[d] === G[1]) {
        if (Z--, Z < 0) return d;
    }
    return -1;
}

function oP2(I, G, Z, d, W) {
    let B = G.href, w = G.title || null, V = I[1].replace(W.other.outputLinkReplace, "$1");
    if (I[0].charAt(0) !== "!") {
        d.state.inLink = !0;
        let C = {
            type: "link",
            raw: Z,
            href: B,
            title: w,
            text: V,
            tokens: d.inlineTokens(V)
        };
        return d.state.inLink = !1, C;
    }
    return {
        type: "image",
        raw: Z,
        href: B,
        title: w,
        text: V
    };
}

function JE3(I, G, Z) {
    let d = I.match(Z.other.indentCodeCompensation);
    if (d === null) return G;
    let W = d[1];
    return G.split(`
`).map(B => {
        let w = B.match(Z.other.beginningSpace);
        if (w === null) return B;
        let [ V ] = w;
        if (V.length >= W.length) return B.slice(W.length);
        return B;
    }).join(`
`);
}

class pT {
    options;
    rules;
    lexer;
    constructor(I) {
        this.options = I || MN;
    }
    space(I) {
        let G = this.rules.block.newline.exec(I);
        if (G && G[0].length > 0) return {
            type: "space",
            raw: G[0]
        };
    }
    code(I) {
        let G = this.rules.block.code.exec(I);
        if (G) {
            let Z = G[0].replace(this.rules.other.codeRemoveIndent, "");
            return {
                type: "code",
                raw: G[0],
                codeBlockStyle: "indented",
                text: !this.options.pedantic ? xT(Z, `
`) : Z
            };
        }
    }
    fences(I) {
        let G = this.rules.block.fences.exec(I);
        if (G) {
            let Z = G[0], d = JE3(Z, G[3] || "", this.rules);
            return {
                type: "code",
                raw: Z,
                lang: G[2] ? G[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : G[2],
                text: d
            };
        }
    }
    heading(I) {
        let G = this.rules.block.heading.exec(I);
        if (G) {
            let Z = G[2].trim();
            if (this.rules.other.endingHash.test(Z)) {
                let d = xT(Z, "#");
                if (this.options.pedantic) Z = d.trim(); else if (!d || this.rules.other.endingSpaceChar.test(d)) Z = d.trim();
            }
            return {
                type: "heading",
                raw: G[0],
                depth: G[1].length,
                text: Z,
                tokens: this.lexer.inline(Z)
            };
        }
    }
    hr(I) {
        let G = this.rules.block.hr.exec(I);
        if (G) return {
            type: "hr",
            raw: xT(G[0], `
`)
        };
    }
    blockquote(I) {
        let G = this.rules.block.blockquote.exec(I);
        if (G) {
            let Z = xT(G[0], `
`).split(`
`), d = "", W = "", B = [];
            while (Z.length > 0) {
                let w = !1, V = [], C;
                for (C = 0; C < Z.length; C++) if (this.rules.other.blockquoteStart.test(Z[C])) V.push(Z[C]), 
                w = !0; else if (!w) V.push(Z[C]); else break;
                Z = Z.slice(C);
                let X = V.join(`
`), Y = X.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
                d = d ? `${d}
${X}` : X, W = W ? `${W}
${Y}` : Y;
                let A = this.lexer.state.top;
                if (this.lexer.state.top = !0, this.lexer.blockTokens(Y, B, !0), 
                this.lexer.state.top = A, Z.length === 0) break;
                let D = B.at(-1);
                if (D?.type === "code") break; else if (D?.type === "blockquote") {
                    let J = D, K = J.raw + `
` + Z.join(`
`), z = this.blockquote(K);
                    B[B.length - 1] = z, d = d.substring(0, d.length - J.raw.length) + z.raw, 
                    W = W.substring(0, W.length - J.text.length) + z.text;
                    break;
                } else if (D?.type === "list") {
                    let J = D, K = J.raw + `
` + Z.join(`
`), z = this.list(K);
                    B[B.length - 1] = z, d = d.substring(0, d.length - D.raw.length) + z.raw, 
                    W = W.substring(0, W.length - J.raw.length) + z.raw, Z = K.substring(B.at(-1).raw.length).split(`
`);
                    continue;
                }
            }
            return {
                type: "blockquote",
                raw: d,
                tokens: B,
                text: W
            };
        }
    }
    list(I) {
        let G = this.rules.block.list.exec(I);
        if (G) {
            let Z = G[1].trim(), d = Z.length > 1, W = {
                type: "list",
                raw: "",
                ordered: d,
                start: d ? +Z.slice(0, -1) : "",
                loose: !1,
                items: []
            };
            if (Z = d ? `\\d{1,9}\\${Z.slice(-1)}` : `\\${Z}`, this.options.pedantic) Z = d ? Z : "[*+-]";
            let B = this.rules.other.listItemRegex(Z), w = !1;
            while (I) {
                let C = !1, X = "", Y = "";
                if (!(G = B.exec(I))) break;
                if (this.rules.block.hr.test(I)) break;
                X = G[0], I = I.substring(X.length);
                let A = G[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, U => " ".repeat(3 * U.length)), D = I.split(`
`, 1)[0], J = !A.trim(), K = 0;
                if (this.options.pedantic) K = 2, Y = A.trimStart(); else if (J) K = G[1].length + 1; else K = G[2].search(this.rules.other.nonSpaceChar), 
                K = K > 4 ? 1 : K, Y = A.slice(K), K += G[1].length;
                if (J && this.rules.other.blankLine.test(D)) X += D + `
`, I = I.substring(D.length + 1), C = !0;
                if (!C) {
                    let U = this.rules.other.nextBulletRegex(K), M = this.rules.other.hrRegex(K), S = this.rules.other.fencesBeginRegex(K), L = this.rules.other.headingBeginRegex(K), P = this.rules.other.htmlBeginRegex(K);
                    while (I) {
                        let m = I.split(`
`, 1)[0], j;
                        if (D = m, this.options.pedantic) D = D.replace(this.rules.other.listReplaceNesting, "  "), 
                        j = D; else j = D.replace(this.rules.other.tabCharGlobal, "    ");
                        if (S.test(D)) break;
                        if (L.test(D)) break;
                        if (P.test(D)) break;
                        if (U.test(D)) break;
                        if (M.test(D)) break;
                        if (j.search(this.rules.other.nonSpaceChar) >= K || !D.trim()) Y += `
` + j.slice(K); else {
                            if (J) break;
                            if (A.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4) break;
                            if (S.test(A)) break;
                            if (L.test(A)) break;
                            if (M.test(A)) break;
                            Y += `
` + D;
                        }
                        if (!J && !D.trim()) J = !0;
                        X += m + `
`, I = I.substring(m.length + 1), A = j.slice(K);
                    }
                }
                if (!W.loose) {
                    if (w) W.loose = !0; else if (this.rules.other.doubleBlankLine.test(X)) w = !0;
                }
                let z = null, Q;
                if (this.options.gfm) {
                    if (z = this.rules.other.listIsTask.exec(Y), z) Q = z[0] !== "[ ] ", 
                    Y = Y.replace(this.rules.other.listReplaceTask, "");
                }
                W.items.push({
                    type: "list_item",
                    raw: X,
                    task: !!z,
                    checked: Q,
                    loose: !1,
                    text: Y,
                    tokens: []
                }), W.raw += X;
            }
            let V = W.items.at(-1);
            if (V) V.raw = V.raw.trimEnd(), V.text = V.text.trimEnd(); else return;
            W.raw = W.raw.trimEnd();
            for (let C = 0; C < W.items.length; C++) if (this.lexer.state.top = !1, 
            W.items[C].tokens = this.lexer.blockTokens(W.items[C].text, []), !W.loose) {
                let X = W.items[C].tokens.filter(A => A.type === "space"), Y = X.length > 0 && X.some(A => this.rules.other.anyLine.test(A.raw));
                W.loose = Y;
            }
            if (W.loose) for (let C = 0; C < W.items.length; C++) W.items[C].loose = !0;
            return W;
        }
    }
    html(I) {
        let G = this.rules.block.html.exec(I);
        if (G) return {
            type: "html",
            block: !0,
            raw: G[0],
            pre: G[1] === "pre" || G[1] === "script" || G[1] === "style",
            text: G[0]
        };
    }
    def(I) {
        let G = this.rules.block.def.exec(I);
        if (G) {
            let Z = G[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), d = G[2] ? G[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", W = G[3] ? G[3].substring(1, G[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : G[3];
            return {
                type: "def",
                tag: Z,
                raw: G[0],
                href: d,
                title: W
            };
        }
    }
    table(I) {
        let G = this.rules.block.table.exec(I);
        if (!G) return;
        if (!this.rules.other.tableDelimiter.test(G[2])) return;
        let Z = sP2(G[1]), d = G[2].replace(this.rules.other.tableAlignChars, "").split("|"), W = G[3]?.trim() ? G[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], B = {
            type: "table",
            raw: G[0],
            header: [],
            align: [],
            rows: []
        };
        if (Z.length !== d.length) return;
        for (let w of d) if (this.rules.other.tableAlignRight.test(w)) B.align.push("right"); else if (this.rules.other.tableAlignCenter.test(w)) B.align.push("center"); else if (this.rules.other.tableAlignLeft.test(w)) B.align.push("left"); else B.align.push(null);
        for (let w = 0; w < Z.length; w++) B.header.push({
            text: Z[w],
            tokens: this.lexer.inline(Z[w]),
            header: !0,
            align: B.align[w]
        });
        for (let w of W) B.rows.push(sP2(w, B.header.length).map((V, C) => {
            return {
                text: V,
                tokens: this.lexer.inline(V),
                header: !1,
                align: B.align[C]
            };
        }));
        return B;
    }
    lheading(I) {
        let G = this.rules.block.lheading.exec(I);
        if (G) return {
            type: "heading",
            raw: G[0],
            depth: G[2].charAt(0) === "=" ? 1 : 2,
            text: G[1],
            tokens: this.lexer.inline(G[1])
        };
    }
    paragraph(I) {
        let G = this.rules.block.paragraph.exec(I);
        if (G) {
            let Z = G[1].charAt(G[1].length - 1) === `
` ? G[1].slice(0, -1) : G[1];
            return {
                type: "paragraph",
                raw: G[0],
                text: Z,
                tokens: this.lexer.inline(Z)
            };
        }
    }
    text(I) {
        let G = this.rules.block.text.exec(I);
        if (G) return {
            type: "text",
            raw: G[0],
            text: G[0],
            tokens: this.lexer.inline(G[0])
        };
    }
    escape(I) {
        let G = this.rules.inline.escape.exec(I);
        if (G) return {
            type: "escape",
            raw: G[0],
            text: G[1]
        };
    }
    tag(I) {
        let G = this.rules.inline.tag.exec(I);
        if (G) {
            if (!this.lexer.state.inLink && this.rules.other.startATag.test(G[0])) this.lexer.state.inLink = !0; else if (this.lexer.state.inLink && this.rules.other.endATag.test(G[0])) this.lexer.state.inLink = !1;
            if (!this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(G[0])) this.lexer.state.inRawBlock = !0; else if (this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(G[0])) this.lexer.state.inRawBlock = !1;
            return {
                type: "html",
                raw: G[0],
                inLink: this.lexer.state.inLink,
                inRawBlock: this.lexer.state.inRawBlock,
                block: !1,
                text: G[0]
            };
        }
    }
    link(I) {
        let G = this.rules.inline.link.exec(I);
        if (G) {
            let Z = G[2].trim();
            if (!this.options.pedantic && this.rules.other.startAngleBracket.test(Z)) {
                if (!this.rules.other.endAngleBracket.test(Z)) return;
                let B = xT(Z.slice(0, -1), "\\");
                if ((Z.length - B.length) % 2 === 0) return;
            } else {
                let B = FE3(G[2], "()");
                if (B > -1) {
                    let V = (G[0].indexOf("!") === 0 ? 5 : 4) + G[1].length + B;
                    G[2] = G[2].substring(0, B), G[0] = G[0].substring(0, V).trim(), 
                    G[3] = "";
                }
            }
            let d = G[2], W = "";
            if (this.options.pedantic) {
                let B = this.rules.other.pedanticHrefTitle.exec(d);
                if (B) d = B[1], W = B[3];
            } else W = G[3] ? G[3].slice(1, -1) : "";
            if (d = d.trim(), this.rules.other.startAngleBracket.test(d)) if (this.options.pedantic && !this.rules.other.endAngleBracket.test(Z)) d = d.slice(1); else d = d.slice(1, -1);
            return oP2(G, {
                href: d ? d.replace(this.rules.inline.anyPunctuation, "$1") : d,
                title: W ? W.replace(this.rules.inline.anyPunctuation, "$1") : W
            }, G[0], this.lexer, this.rules);
        }
    }
    reflink(I, G) {
        let Z;
        if ((Z = this.rules.inline.reflink.exec(I)) || (Z = this.rules.inline.nolink.exec(I))) {
            let d = (Z[2] || Z[1]).replace(this.rules.other.multipleSpaceGlobal, " "), W = G[d.toLowerCase()];
            if (!W) {
                let B = Z[0].charAt(0);
                return {
                    type: "text",
                    raw: B,
                    text: B
                };
            }
            return oP2(Z, W, Z[0], this.lexer, this.rules);
        }
    }
    emStrong(I, G, Z = "") {
        let d = this.rules.inline.emStrongLDelim.exec(I);
        if (!d) return;
        if (d[3] && Z.match(this.rules.other.unicodeAlphaNumeric)) return;
        if (!(d[1] || d[2]) || !Z || this.rules.inline.punctuation.exec(Z)) {
            let B = [ ...d[0] ].length - 1, w, V, C = B, X = 0, Y = d[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
            Y.lastIndex = 0, G = G.slice(-1 * I.length + B);
            while ((d = Y.exec(G)) != null) {
                if (w = d[1] || d[2] || d[3] || d[4] || d[5] || d[6], !w) continue;
                if (V = [ ...w ].length, d[3] || d[4]) {
                    C += V;
                    continue;
                } else if (d[5] || d[6]) {
                    if (B % 3 && !((B + V) % 3)) {
                        X += V;
                        continue;
                    }
                }
                if (C -= V, C > 0) continue;
                V = Math.min(V, V + C + X);
                let A = [ ...d[0] ][0].length, D = I.slice(0, B + d.index + A + V);
                if (Math.min(B, V) % 2) {
                    let K = D.slice(1, -1);
                    return {
                        type: "em",
                        raw: D,
                        text: K,
                        tokens: this.lexer.inlineTokens(K)
                    };
                }
                let J = D.slice(2, -2);
                return {
                    type: "strong",
                    raw: D,
                    text: J,
                    tokens: this.lexer.inlineTokens(J)
                };
            }
        }
    }
    codespan(I) {
        let G = this.rules.inline.code.exec(I);
        if (G) {
            let Z = G[2].replace(this.rules.other.newLineCharGlobal, " "), d = this.rules.other.nonSpaceChar.test(Z), W = this.rules.other.startingSpaceChar.test(Z) && this.rules.other.endingSpaceChar.test(Z);
            if (d && W) Z = Z.substring(1, Z.length - 1);
            return {
                type: "codespan",
                raw: G[0],
                text: Z
            };
        }
    }
    br(I) {
        let G = this.rules.inline.br.exec(I);
        if (G) return {
            type: "br",
            raw: G[0]
        };
    }
    del(I) {
        let G = this.rules.inline.del.exec(I);
        if (G) return {
            type: "del",
            raw: G[0],
            text: G[2],
            tokens: this.lexer.inlineTokens(G[2])
        };
    }
    autolink(I) {
        let G = this.rules.inline.autolink.exec(I);
        if (G) {
            let Z, d;
            if (G[2] === "@") Z = G[1], d = "mailto:" + Z; else Z = G[1], d = Z;
            return {
                type: "link",
                raw: G[0],
                text: Z,
                href: d,
                tokens: [ {
                    type: "text",
                    raw: Z,
                    text: Z
                } ]
            };
        }
    }
    url(I) {
        let G;
        if (G = this.rules.inline.url.exec(I)) {
            let Z, d;
            if (G[2] === "@") Z = G[0], d = "mailto:" + Z; else {
                let W;
                do {
                    W = G[0], G[0] = this.rules.inline._backpedal.exec(G[0])?.[0] ?? "";
                } while (W !== G[0]);
                if (Z = G[0], G[1] === "www.") d = "http://" + G[0]; else d = G[0];
            }
            return {
                type: "link",
                raw: G[0],
                text: Z,
                href: d,
                tokens: [ {
                    type: "text",
                    raw: Z,
                    text: Z
                } ]
            };
        }
    }
    inlineText(I) {
        let G = this.rules.inline.text.exec(I);
        if (G) {
            let Z = this.lexer.state.inRawBlock;
            return {
                type: "text",
                raw: G[0],
                text: G[0],
                escaped: Z
            };
        }
    }
}

class LB {
    tokens;
    options;
    state;
    tokenizer;
    inlineQueue;
    constructor(I) {
        this.tokens = [], this.tokens.links = Object.create(null), this.options = I || MN, 
        this.options.tokenizer = this.options.tokenizer || new pT(), this.tokenizer = this.options.tokenizer, 
        this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], 
        this.state = {
            inLink: !1,
            inRawBlock: !1,
            top: !0
        };
        let G = {
            other: XZ,
            block: u01.normal,
            inline: kT.normal
        };
        if (this.options.pedantic) G.block = u01.pedantic, G.inline = kT.pedantic; else if (this.options.gfm) if (G.block = u01.gfm, 
        this.options.breaks) G.inline = kT.breaks; else G.inline = kT.gfm;
        this.tokenizer.rules = G;
    }
    static get rules() {
        return {
            block: u01,
            inline: kT
        };
    }
    static lex(I, G) {
        return new LB(G).lex(I);
    }
    static lexInline(I, G) {
        return new LB(G).inlineTokens(I);
    }
    lex(I) {
        I = I.replace(XZ.carriageReturn, `
`), this.blockTokens(I, this.tokens);
        for (let G = 0; G < this.inlineQueue.length; G++) {
            let Z = this.inlineQueue[G];
            this.inlineTokens(Z.src, Z.tokens);
        }
        return this.inlineQueue = [], this.tokens;
    }
    blockTokens(I, G = [], Z = !1) {
        if (this.options.pedantic) I = I.replace(XZ.tabCharGlobal, "    ").replace(XZ.spaceLine, "");
        while (I) {
            let d;
            if (this.options.extensions?.block?.some(B => {
                if (d = B.call({
                    lexer: this
                }, I, G)) return I = I.substring(d.raw.length), G.push(d), !0;
                return !1;
            })) continue;
            if (d = this.tokenizer.space(I)) {
                I = I.substring(d.raw.length);
                let B = G.at(-1);
                if (d.raw.length === 1 && B !== void 0) B.raw += `
`; else G.push(d);
                continue;
            }
            if (d = this.tokenizer.code(I)) {
                I = I.substring(d.raw.length);
                let B = G.at(-1);
                if (B?.type === "paragraph" || B?.type === "text") B.raw += `
` + d.raw, B.text += `
` + d.text, this.inlineQueue.at(-1).src = B.text; else G.push(d);
                continue;
            }
            if (d = this.tokenizer.fences(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.heading(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.hr(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.blockquote(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.list(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.html(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.def(I)) {
                I = I.substring(d.raw.length);
                let B = G.at(-1);
                if (B?.type === "paragraph" || B?.type === "text") B.raw += `
` + d.raw, B.text += `
` + d.raw, this.inlineQueue.at(-1).src = B.text; else if (!this.tokens.links[d.tag]) this.tokens.links[d.tag] = {
                    href: d.href,
                    title: d.title
                };
                continue;
            }
            if (d = this.tokenizer.table(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            if (d = this.tokenizer.lheading(I)) {
                I = I.substring(d.raw.length), G.push(d);
                continue;
            }
            let W = I;
            if (this.options.extensions?.startBlock) {
                let B = 1 / 0, w = I.slice(1), V;
                if (this.options.extensions.startBlock.forEach(C => {
                    if (V = C.call({
                        lexer: this
                    }, w), typeof V === "number" && V >= 0) B = Math.min(B, V);
                }), B < 1 / 0 && B >= 0) W = I.substring(0, B + 1);
            }
            if (this.state.top && (d = this.tokenizer.paragraph(W))) {
                let B = G.at(-1);
                if (Z && B?.type === "paragraph") B.raw += `
` + d.raw, B.text += `
` + d.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = B.text; else G.push(d);
                Z = W.length !== I.length, I = I.substring(d.raw.length);
                continue;
            }
            if (d = this.tokenizer.text(I)) {
                I = I.substring(d.raw.length);
                let B = G.at(-1);
                if (B?.type === "text") B.raw += `
` + d.raw, B.text += `
` + d.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = B.text; else G.push(d);
                continue;
            }
            if (I) {
                let B = "Infinite loop on byte: " + I.charCodeAt(0);
                if (this.options.silent) {
                    console.error(B);
                    break;
                } else throw new Error(B);
            }
        }
        return this.state.top = !0, G;
    }
    inline(I, G = []) {
        return this.inlineQueue.push({
            src: I,
            tokens: G
        }), G;
    }
    inlineTokens(I, G = []) {
        let Z = I, d = null;
        if (this.tokens.links) {
            let w = Object.keys(this.tokens.links);
            if (w.length > 0) {
                while ((d = this.tokenizer.rules.inline.reflinkSearch.exec(Z)) != null) if (w.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1))) Z = Z.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + Z.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
        }
        while ((d = this.tokenizer.rules.inline.blockSkip.exec(Z)) != null) Z = Z.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + Z.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        while ((d = this.tokenizer.rules.inline.anyPunctuation.exec(Z)) != null) Z = Z.slice(0, d.index) + "++" + Z.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
        let W = !1, B = "";
        while (I) {
            if (!W) B = "";
            W = !1;
            let w;
            if (this.options.extensions?.inline?.some(C => {
                if (w = C.call({
                    lexer: this
                }, I, G)) return I = I.substring(w.raw.length), G.push(w), !0;
                return !1;
            })) continue;
            if (w = this.tokenizer.escape(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.tag(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.link(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.reflink(I, this.tokens.links)) {
                I = I.substring(w.raw.length);
                let C = G.at(-1);
                if (w.type === "text" && C?.type === "text") C.raw += w.raw, C.text += w.text; else G.push(w);
                continue;
            }
            if (w = this.tokenizer.emStrong(I, Z, B)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.codespan(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.br(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.del(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (w = this.tokenizer.autolink(I)) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            if (!this.state.inLink && (w = this.tokenizer.url(I))) {
                I = I.substring(w.raw.length), G.push(w);
                continue;
            }
            let V = I;
            if (this.options.extensions?.startInline) {
                let C = 1 / 0, X = I.slice(1), Y;
                if (this.options.extensions.startInline.forEach(A => {
                    if (Y = A.call({
                        lexer: this
                    }, X), typeof Y === "number" && Y >= 0) C = Math.min(C, Y);
                }), C < 1 / 0 && C >= 0) V = I.substring(0, C + 1);
            }
            if (w = this.tokenizer.inlineText(V)) {
                if (I = I.substring(w.raw.length), w.raw.slice(-1) !== "_") B = w.raw.slice(-1);
                W = !0;
                let C = G.at(-1);
                if (C?.type === "text") C.raw += w.raw, C.text += w.text; else G.push(w);
                continue;
            }
            if (I) {
                let C = "Infinite loop on byte: " + I.charCodeAt(0);
                if (this.options.silent) {
                    console.error(C);
                    break;
                } else throw new Error(C);
            }
        }
        return G;
    }
}

class iT {
    options;
    parser;
    constructor(I) {
        this.options = I || MN;
    }
    space(I) {
        return "";
    }
    code({
        text: I,
        lang: G,
        escaped: Z
    }) {
        let d = (G || "").match(XZ.notSpaceStart)?.[0], W = I.replace(XZ.endingNewline, "") + `
`;
        if (!d) return "<pre><code>" + (Z ? W : lX(W, !0)) + `</code></pre>
`;
        return '<pre><code class="language-' + lX(d) + '">' + (Z ? W : lX(W, !0)) + `</code></pre>
`;
    }
    blockquote({
        tokens: I
    }) {
        return `<blockquote>
${this.parser.parse(I)}</blockquote>
`;
    }
    html({
        text: I
    }) {
        return I;
    }
    heading({
        tokens: I,
        depth: G
    }) {
        return `<h${G}>${this.parser.parseInline(I)}</h${G}>
`;
    }
    hr(I) {
        return `<hr>
`;
    }
    list(I) {
        let {
            ordered: G,
            start: Z
        } = I, d = "";
        for (let w = 0; w < I.items.length; w++) {
            let V = I.items[w];
            d += this.listitem(V);
        }
        let W = G ? "ol" : "ul", B = G && Z !== 1 ? ' start="' + Z + '"' : "";
        return "<" + W + B + `>
` + d + "</" + W + `>
`;
    }
    listitem(I) {
        let G = "";
        if (I.task) {
            let Z = this.checkbox({
                checked: !!I.checked
            });
            if (I.loose) if (I.tokens[0]?.type === "paragraph") {
                if (I.tokens[0].text = Z + " " + I.tokens[0].text, I.tokens[0].tokens && I.tokens[0].tokens.length > 0 && I.tokens[0].tokens[0].type === "text") I.tokens[0].tokens[0].text = Z + " " + lX(I.tokens[0].tokens[0].text), 
                I.tokens[0].tokens[0].escaped = !0;
            } else I.tokens.unshift({
                type: "text",
                raw: Z + " ",
                text: Z + " ",
                escaped: !0
            }); else G += Z + " ";
        }
        return G += this.parser.parse(I.tokens, !!I.loose), `<li>${G}</li>
`;
    }
    checkbox({
        checked: I
    }) {
        return "<input " + (I ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
    }
    paragraph({
        tokens: I
    }) {
        return `<p>${this.parser.parseInline(I)}</p>
`;
    }
    table(I) {
        let G = "", Z = "";
        for (let W = 0; W < I.header.length; W++) Z += this.tablecell(I.header[W]);
        G += this.tablerow({
            text: Z
        });
        let d = "";
        for (let W = 0; W < I.rows.length; W++) {
            let B = I.rows[W];
            Z = "";
            for (let w = 0; w < B.length; w++) Z += this.tablecell(B[w]);
            d += this.tablerow({
                text: Z
            });
        }
        if (d) d = `<tbody>${d}</tbody>`;
        return `<table>
<thead>
` + G + `</thead>
` + d + `</table>
`;
    }
    tablerow({
        text: I
    }) {
        return `<tr>
${I}</tr>
`;
    }
    tablecell(I) {
        let G = this.parser.parseInline(I.tokens), Z = I.header ? "th" : "td";
        return (I.align ? `<${Z} align="${I.align}">` : `<${Z}>`) + G + `</${Z}>
`;
    }
    strong({
        tokens: I
    }) {
        return `<strong>${this.parser.parseInline(I)}</strong>`;
    }
    em({
        tokens: I
    }) {
        return `<em>${this.parser.parseInline(I)}</em>`;
    }
    codespan({
        text: I
    }) {
        return `<code>${lX(I, !0)}</code>`;
    }
    br(I) {
        return "<br>";
    }
    del({
        tokens: I
    }) {
        return `<del>${this.parser.parseInline(I)}</del>`;
    }
    link({
        href: I,
        title: G,
        tokens: Z
    }) {
        let d = this.parser.parseInline(Z), W = rP2(I);
        if (W === null) return d;
        I = W;
        let B = '<a href="' + I + '"';
        if (G) B += ' title="' + lX(G) + '"';
        return B += ">" + d + "</a>", B;
    }
    image({
        href: I,
        title: G,
        text: Z
    }) {
        let d = rP2(I);
        if (d === null) return lX(Z);
        I = d;
        let W = `<img src="${I}" alt="${Z}"`;
        if (G) W += ` title="${lX(G)}"`;
        return W += ">", W;
    }
    text(I) {
        return "tokens" in I && I.tokens ? this.parser.parseInline(I.tokens) : "escaped" in I && I.escaped ? I.text : lX(I.text);
    }
}

class T01 {
    strong({
        text: I
    }) {
        return I;
    }
    em({
        text: I
    }) {
        return I;
    }
    codespan({
        text: I
    }) {
        return I;
    }
    del({
        text: I
    }) {
        return I;
    }
    html({
        text: I
    }) {
        return I;
    }
    text({
        text: I
    }) {
        return I;
    }
    link({
        text: I
    }) {
        return "" + I;
    }
    image({
        text: I
    }) {
        return "" + I;
    }
    br() {
        return "";
    }
}

class PB {
    options;
    renderer;
    textRenderer;
    constructor(I) {
        this.options = I || MN, this.options.renderer = this.options.renderer || new iT(), 
        this.renderer = this.options.renderer, this.renderer.options = this.options, 
        this.renderer.parser = this, this.textRenderer = new T01();
    }
    static parse(I, G) {
        return new PB(G).parse(I);
    }
    static parseInline(I, G) {
        return new PB(G).parseInline(I);
    }
    parse(I, G = !0) {
        let Z = "";
        for (let d = 0; d < I.length; d++) {
            let W = I[d];
            if (this.options.extensions?.renderers?.[W.type]) {
                let w = W, V = this.options.extensions.renderers[w.type].call({
                    parser: this
                }, w);
                if (V !== !1 || ![ "space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text" ].includes(w.type)) {
                    Z += V || "";
                    continue;
                }
            }
            let B = W;
            switch (B.type) {
              case "space":
                {
                    Z += this.renderer.space(B);
                    continue;
                }

              case "hr":
                {
                    Z += this.renderer.hr(B);
                    continue;
                }

              case "heading":
                {
                    Z += this.renderer.heading(B);
                    continue;
                }

              case "code":
                {
                    Z += this.renderer.code(B);
                    continue;
                }

              case "table":
                {
                    Z += this.renderer.table(B);
                    continue;
                }

              case "blockquote":
                {
                    Z += this.renderer.blockquote(B);
                    continue;
                }

              case "list":
                {
                    Z += this.renderer.list(B);
                    continue;
                }

              case "html":
                {
                    Z += this.renderer.html(B);
                    continue;
                }

              case "paragraph":
                {
                    Z += this.renderer.paragraph(B);
                    continue;
                }

              case "text":
                {
                    let w = B, V = this.renderer.text(w);
                    while (d + 1 < I.length && I[d + 1].type === "text") w = I[++d], 
                    V += `
` + this.renderer.text(w);
                    if (G) Z += this.renderer.paragraph({
                        type: "paragraph",
                        raw: V,
                        text: V,
                        tokens: [ {
                            type: "text",
                            raw: V,
                            text: V,
                            escaped: !0
                        } ]
                    }); else Z += V;
                    continue;
                }

              default:
                {
                    let w = 'Token with "' + B.type + '" type was not found.';
                    if (this.options.silent) return console.error(w), ""; else throw new Error(w);
                }
            }
        }
        return Z;
    }
    parseInline(I, G = this.renderer) {
        let Z = "";
        for (let d = 0; d < I.length; d++) {
            let W = I[d];
            if (this.options.extensions?.renderers?.[W.type]) {
                let w = this.options.extensions.renderers[W.type].call({
                    parser: this
                }, W);
                if (w !== !1 || ![ "escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text" ].includes(W.type)) {
                    Z += w || "";
                    continue;
                }
            }
            let B = W;
            switch (B.type) {
              case "escape":
                {
                    Z += G.text(B);
                    break;
                }

              case "html":
                {
                    Z += G.html(B);
                    break;
                }

              case "link":
                {
                    Z += G.link(B);
                    break;
                }

              case "image":
                {
                    Z += G.image(B);
                    break;
                }

              case "strong":
                {
                    Z += G.strong(B);
                    break;
                }

              case "em":
                {
                    Z += G.em(B);
                    break;
                }

              case "codespan":
                {
                    Z += G.codespan(B);
                    break;
                }

              case "br":
                {
                    Z += G.br(B);
                    break;
                }

              case "del":
                {
                    Z += G.del(B);
                    break;
                }

              case "text":
                {
                    Z += G.text(B);
                    break;
                }

              default:
                {
                    let w = 'Token with "' + B.type + '" type was not found.';
                    if (this.options.silent) return console.error(w), ""; else throw new Error(w);
                }
            }
        }
        return Z;
    }
}

class cT {
    options;
    block;
    constructor(I) {
        this.options = I || MN;
    }
    static passThroughHooks = new Set([ "preprocess", "postprocess", "processAllTokens" ]);
    preprocess(I) {
        return I;
    }
    postprocess(I) {
        return I;
    }
    processAllTokens(I) {
        return I;
    }
    provideLexer() {
        return this.block ? LB.lex : LB.lexInline;
    }
    provideParser() {
        return this.block ? PB.parse : PB.parseInline;
    }
}

class Xu2 {
    defaults = if1();
    options = this.setOptions;
    parse = this.parseMarkdown(!0);
    parseInline = this.parseMarkdown(!1);
    Parser = PB;
    Renderer = iT;
    TextRenderer = T01;
    Lexer = LB;
    Tokenizer = pT;
    Hooks = cT;
    constructor(...I) {
        this.use(...I);
    }
    walkTokens(I, G) {
        let Z = [];
        for (let d of I) switch (Z = Z.concat(G.call(this, d)), d.type) {
          case "table":
            {
                let W = d;
                for (let B of W.header) Z = Z.concat(this.walkTokens(B.tokens, G));
                for (let B of W.rows) for (let w of B) Z = Z.concat(this.walkTokens(w.tokens, G));
                break;
            }

          case "list":
            {
                let W = d;
                Z = Z.concat(this.walkTokens(W.items, G));
                break;
            }

          default:
            {
                let W = d;
                if (this.defaults.extensions?.childTokens?.[W.type]) this.defaults.extensions.childTokens[W.type].forEach(B => {
                    let w = W[B].flat(1 / 0);
                    Z = Z.concat(this.walkTokens(w, G));
                }); else if (W.tokens) Z = Z.concat(this.walkTokens(W.tokens, G));
            }
        }
        return Z;
    }
    use(...I) {
        let G = this.defaults.extensions || {
            renderers: {},
            childTokens: {}
        };
        return I.forEach(Z => {
            let d = {
                ...Z
            };
            if (d.async = this.defaults.async || d.async || !1, Z.extensions) Z.extensions.forEach(W => {
                if (!W.name) throw new Error("extension name required");
                if ("renderer" in W) {
                    let B = G.renderers[W.name];
                    if (B) G.renderers[W.name] = function(...w) {
                        let V = W.renderer.apply(this, w);
                        if (V === !1) V = B.apply(this, w);
                        return V;
                    }; else G.renderers[W.name] = W.renderer;
                }
                if ("tokenizer" in W) {
                    if (!W.level || W.level !== "block" && W.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
                    let B = G[W.level];
                    if (B) B.unshift(W.tokenizer); else G[W.level] = [ W.tokenizer ];
                    if (W.start) {
                        if (W.level === "block") if (G.startBlock) G.startBlock.push(W.start); else G.startBlock = [ W.start ]; else if (W.level === "inline") if (G.startInline) G.startInline.push(W.start); else G.startInline = [ W.start ];
                    }
                }
                if ("childTokens" in W && W.childTokens) G.childTokens[W.name] = W.childTokens;
            }), d.extensions = G;
            if (Z.renderer) {
                let W = this.defaults.renderer || new iT(this.defaults);
                for (let B in Z.renderer) {
                    if (!(B in W)) throw new Error(`renderer '${B}' does not exist`);
                    if ([ "options", "parser" ].includes(B)) continue;
                    let w = B, V = Z.renderer[w], C = W[w];
                    W[w] = (...X) => {
                        let Y = V.apply(W, X);
                        if (Y === !1) Y = C.apply(W, X);
                        return Y || "";
                    };
                }
                d.renderer = W;
            }
            if (Z.tokenizer) {
                let W = this.defaults.tokenizer || new pT(this.defaults);
                for (let B in Z.tokenizer) {
                    if (!(B in W)) throw new Error(`tokenizer '${B}' does not exist`);
                    if ([ "options", "rules", "lexer" ].includes(B)) continue;
                    let w = B, V = Z.tokenizer[w], C = W[w];
                    W[w] = (...X) => {
                        let Y = V.apply(W, X);
                        if (Y === !1) Y = C.apply(W, X);
                        return Y;
                    };
                }
                d.tokenizer = W;
            }
            if (Z.hooks) {
                let W = this.defaults.hooks || new cT();
                for (let B in Z.hooks) {
                    if (!(B in W)) throw new Error(`hook '${B}' does not exist`);
                    if ([ "options", "block" ].includes(B)) continue;
                    let w = B, V = Z.hooks[w], C = W[w];
                    if (cT.passThroughHooks.has(B)) W[w] = X => {
                        if (this.defaults.async) return Promise.resolve(V.call(W, X)).then(A => {
                            return C.call(W, A);
                        });
                        let Y = V.call(W, X);
                        return C.call(W, Y);
                    }; else W[w] = (...X) => {
                        let Y = V.apply(W, X);
                        if (Y === !1) Y = C.apply(W, X);
                        return Y;
                    };
                }
                d.hooks = W;
            }
            if (Z.walkTokens) {
                let W = this.defaults.walkTokens, B = Z.walkTokens;
                d.walkTokens = function(w) {
                    let V = [];
                    if (V.push(B.call(this, w)), W) V = V.concat(W.call(this, w));
                    return V;
                };
            }
            this.defaults = {
                ...this.defaults,
                ...d
            };
        }), this;
    }
    setOptions(I) {
        return this.defaults = {
            ...this.defaults,
            ...I
        }, this;
    }
    lexer(I, G) {
        return LB.lex(I, G ?? this.defaults);
    }
    parser(I, G) {
        return PB.parse(I, G ?? this.defaults);
    }
    parseMarkdown(I) {
        return (Z, d) => {
            let W = {
                ...d
            }, B = {
                ...this.defaults,
                ...W
            }, w = this.onError(!!B.silent, !!B.async);
            if (this.defaults.async === !0 && W.async === !1) return w(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
            if (typeof Z === "undefined" || Z === null) return w(new Error("marked(): input parameter is undefined or null"));
            if (typeof Z !== "string") return w(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(Z) + ", string expected"));
            if (B.hooks) B.hooks.options = B, B.hooks.block = I;
            let V = B.hooks ? B.hooks.provideLexer() : I ? LB.lex : LB.lexInline, C = B.hooks ? B.hooks.provideParser() : I ? PB.parse : PB.parseInline;
            if (B.async) return Promise.resolve(B.hooks ? B.hooks.preprocess(Z) : Z).then(X => V(X, B)).then(X => B.hooks ? B.hooks.processAllTokens(X) : X).then(X => B.walkTokens ? Promise.all(this.walkTokens(X, B.walkTokens)).then(() => X) : X).then(X => C(X, B)).then(X => B.hooks ? B.hooks.postprocess(X) : X).catch(w);
            try {
                if (B.hooks) Z = B.hooks.preprocess(Z);
                let X = V(Z, B);
                if (B.hooks) X = B.hooks.processAllTokens(X);
                if (B.walkTokens) this.walkTokens(X, B.walkTokens);
                let Y = C(X, B);
                if (B.hooks) Y = B.hooks.postprocess(Y);
                return Y;
            } catch (X) {
                return w(X);
            }
        };
    }
    onError(I, G) {
        return Z => {
            if (Z.message += `
Please report this to https://github.com/markedjs/marked.`, I) {
                let d = "<p>An error occurred:</p><pre>" + lX(Z.message + "", !0) + "</pre>";
                if (G) return Promise.resolve(d);
                return d;
            }
            if (G) return Promise.reject(Z);
            throw Z;
        };
    }
}

var EN = new Xu2();

function v3(I, G) {
    return EN.parse(I, G);
}

v3.options = v3.setOptions = function(I) {
    return EN.setOptions(I), v3.defaults = EN.defaults, eP2(v3.defaults), v3;
};

v3.getDefaults = if1;

v3.defaults = MN;

v3.use = function(...I) {
    return EN.use(...I), v3.defaults = EN.defaults, eP2(v3.defaults), v3;
};

v3.walkTokens = function(I, G) {
    return EN.walkTokens(I, G);
};

v3.parseInline = EN.parseInline;

v3.Parser = PB;

v3.parser = PB.parse;

v3.Renderer = iT;

v3.TextRenderer = T01;

v3.Lexer = LB;

v3.lexer = LB.lex;

v3.Tokenizer = pT;

v3.Hooks = cT;

v3.parse = v3;

var {
    options: p66,
    setOptions: i66,
    use: n66,
    walkTokens: a66,
    parseInline: r66
} = v3;

var s66 = PB.parse, o66 = LB.lex;

var aT = A1(Rg1(), 1);

import {
    EOL as gV
} from "os";

function aE(I) {
    return v3.lexer(bf1(I)).map(G => UV(G)).join("").trim();
}

function UV(I, G = 0, Z = null, d = null) {
    switch (I.type) {
      case "blockquote":
        return T0.dim.italic((I.tokens ?? []).map(W => UV(W)).join(""));

      case "code":
        if (I.lang && aT.supportsLanguage(I.lang)) return aT.highlight(I.text, {
            language: I.lang
        }) + gV; else return W0(`Language not supported while highlighting code, falling back to markdown: ${I.lang}`), 
        aT.highlight(I.text, {
            language: "markdown"
        }) + gV;

      case "codespan":
        return T0.ansi256(g8().permission)(I.text);

      case "em":
        return T0.italic((I.tokens ?? []).map(W => UV(W)).join(""));

      case "strong":
        return T0.bold((I.tokens ?? []).map(W => UV(W)).join(""));

      case "heading":
        switch (I.depth) {
          case 1:
            return T0.bold.italic.underline((I.tokens ?? []).map(W => UV(W)).join("")) + gV + gV;

          case 2:
            return T0.bold((I.tokens ?? []).map(W => UV(W)).join("")) + gV + gV;

          default:
            return T0.bold.dim((I.tokens ?? []).map(W => UV(W)).join("")) + gV + gV;
        }

      case "hr":
        return "---";

      case "image":
        return `[Image: ${I.title}: ${I.href}]`;

      case "link":
        return T0.ansi256(g8().permission)(I.href);

      case "list":
        return I.items.map((W, B) => UV(W, G, I.ordered ? I.start + B : null, I)).join("");

      case "list_item":
        return (I.tokens ?? []).map(W => `${"  ".repeat(G)}${UV(W, G + 1, Z, I)}`).join("");

      case "paragraph":
        return (I.tokens ?? []).map(W => UV(W)).join("") + gV;

      case "space":
        return gV;

      case "text":
        if (d?.type === "list_item") return `${Z === null ? "-" : QE3(G, Z) + "."} ${I.tokens ? I.tokens.map(W => UV(W, G, Z, I)).join("") : I.text}${gV}`; else return I.text;
    }
    return "";
}

var KE3 = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai", "aj", "ak", "al", "am", "an", "ao", "ap", "aq", "ar", "as", "at", "au", "av", "aw", "ax", "ay", "az" ], zE3 = [ "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx", "xxi", "xxii", "xxiii", "xxiv", "xxv", "xxvi", "xxvii", "xxviii", "xxix", "xxx", "xxxi", "xxxii", "xxxiii", "xxxiv", "xxxv", "xxxvi", "xxxvii", "xxxviii", "xxxix", "xl" ];

function QE3(I, G) {
    switch (I) {
      case 0:
      case 1:
        return G.toString();

      case 2:
        return KE3[G - 1];

      case 3:
        return zE3[G - 1];

      default:
        return G.toString();
    }
}

function Yu2({
    param: {
        text: I
    },
    costUSD: G,
    durationMs: Z,
    debug: d,
    addMargin: W,
    shouldShowDot: B,
    verbose: w
}) {
    let {
        columns: V
    } = Q5();
    if (M01(I)) return null;
    if (I.startsWith("<bash-stdout") || I.startsWith("<bash-stderr")) return m8.default.createElement(cP2, {
        content: I,
        verbose: w
    });
    if (I.startsWith("<local-command-stdout") || I.startsWith("<local-command-stderr")) return m8.default.createElement(iP2, {
        content: I
    });
    if (I.startsWith(qB)) return m8.default.createElement(Bd, null, m8.default.createElement(O, {
        color: e1().error
    }, I === qB ? `${qB}: Please wait a moment and try again.` : I));
    switch (I) {
      case qT:
      case DV:
        return null;

      case IW:
      case pE:
        return m8.default.createElement(Bd, null, m8.default.createElement($01, null));

      case AU1:
        return m8.default.createElement(Bd, null, m8.default.createElement(O, {
            color: e1().error
        }, "Context low · Run /compact to compact & continue"));

      case _U1:
        return m8.default.createElement(Bd, null, m8.default.createElement(O, {
            color: e1().error
        }, "Credit balance too low · Add funds: https://console.anthropic.com/settings/billing"));

      case R11:
        return m8.default.createElement(Bd, null, m8.default.createElement(O, {
            color: e1().error
        }, R11));

      default:
        return m8.default.createElement(p, {
            alignItems: "flex-start",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: W ? 1 : 0,
            width: "100%"
        }, m8.default.createElement(p, {
            flexDirection: "row"
        }, B && m8.default.createElement(p, {
            minWidth: 2
        }, m8.default.createElement(O, {
            color: e1().text
        }, nE)), m8.default.createElement(p, {
            flexDirection: "column",
            width: V - 6
        }, m8.default.createElement(O, null, aE(I)))), m8.default.createElement(zJ, {
            costUSD: G,
            durationMs: Z,
            debug: d
        }));
    }
}

var rT = A1(u1(), 1);

function Au2({
    addMargin: I,
    param: {
        text: G
    }
}) {
    let Z = Id(G, "command-message"), d = Id(G, "command-args");
    if (!Z) return null;
    let W = e1();
    return rT.createElement(p, {
        flexDirection: "column",
        marginTop: I ? 1 : 0,
        width: "100%"
    }, rT.createElement(O, {
        color: W.secondaryText
    }, "> /", Z, " ", d));
}

var rE = A1(u1(), 1);

function _u2({
    addMargin: I,
    param: {
        text: G
    }
}) {
    let {
        columns: Z
    } = Q5();
    if (!G) return W0("No content found in user prompt message"), null;
    return rE.default.createElement(p, {
        flexDirection: "row",
        marginTop: I ? 1 : 0,
        width: "100%"
    }, rE.default.createElement(p, {
        minWidth: 2,
        width: 2
    }, rE.default.createElement(O, {
        color: e1().secondaryText
    }, ">")), rE.default.createElement(p, {
        flexDirection: "column",
        width: Z - 4
    }, rE.default.createElement(O, {
        color: e1().secondaryText,
        wrap: "wrap"
    }, G)));
}

var $N = A1(u1(), 1);

var NE3 = A1(u1(), 1);

function Hu2({
    addMargin: I,
    param: G
}) {
    if (G.text.trim() === FJ) return null;
    if (G.text.includes("<bash-input>")) return $N.createElement(f01, {
        addMargin: I,
        param: G
    });
    if (G.text.includes("<command-name>") || G.text.includes("<command-message>")) return $N.createElement(Au2, {
        addMargin: I,
        param: G
    });
    return $N.createElement(_u2, {
        addMargin: I,
        param: G
    });
}

var sT = A1(u1(), 1);

function Du2({
    param: {
        thinking: I
    },
    addMargin: G = !1
}) {
    if (!I) return null;
    return sT.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        marginTop: G ? 1 : 0,
        width: "100%"
    }, sT.default.createElement(O, {
        color: e1().secondaryText,
        italic: !0
    }, "✻ Thinking…"), sT.default.createElement(p, {
        paddingLeft: 2
    }, sT.default.createElement(O, {
        color: e1().secondaryText,
        italic: !0
    }, aE(I))));
}

var tf1 = A1(u1(), 1);

function Fu2({
    addMargin: I = !1
}) {
    return tf1.default.createElement(p, {
        marginTop: I ? 1 : 0
    }, tf1.default.createElement(O, {
        color: e1().secondaryText,
        italic: !0
    }, "✻ Thinking…"));
}

function SN({
    message: I,
    messages: G,
    addMargin: Z,
    tools: d,
    verbose: W,
    debug: B,
    erroredToolUseIDs: w,
    inProgressToolUseIDs: V,
    unresolvedToolUseIDs: C,
    shouldAnimate: X,
    shouldShowDot: Y,
    width: A
}) {
    if (I.type === "assistant") return V8.createElement(p, {
        flexDirection: "column",
        width: "100%"
    }, I.message.content.map((J, K) => V8.createElement(gE3, {
        key: K,
        param: J,
        costUSD: I.costUSD,
        durationMs: I.durationMs,
        addMargin: Z,
        tools: d,
        debug: B,
        options: {
            verbose: W
        },
        erroredToolUseIDs: w,
        inProgressToolUseIDs: V,
        unresolvedToolUseIDs: C,
        shouldAnimate: X,
        shouldShowDot: Y,
        width: A
    })));
    let D = typeof I.message.content === "string" ? [ {
        type: "text",
        text: I.message.content
    } ] : I.message.content;
    return V8.createElement(p, {
        flexDirection: "column",
        width: "100%"
    }, D.map((J, K) => V8.createElement(qE3, {
        key: K,
        message: I,
        messages: G,
        addMargin: Z,
        tools: d,
        param: J,
        options: {
            verbose: W
        }
    })));
}

function qE3({
    message: I,
    messages: G,
    addMargin: Z,
    tools: d,
    param: W,
    options: {
        verbose: B
    }
}) {
    let {
        columns: w
    } = Q5();
    switch (W.type) {
      case "text":
        return V8.createElement(Hu2, {
            addMargin: Z,
            param: W
        });

      case "tool_result":
        return V8.createElement(kP2, {
            param: W,
            message: I,
            messages: G,
            tools: d,
            verbose: B,
            width: w - 5
        });
    }
}

function gE3({
    param: I,
    costUSD: G,
    durationMs: Z,
    addMargin: d,
    tools: W,
    debug: B,
    options: {
        verbose: w
    },
    erroredToolUseIDs: V,
    inProgressToolUseIDs: C,
    unresolvedToolUseIDs: X,
    shouldAnimate: Y,
    shouldShowDot: A,
    width: D
}) {
    switch (I.type) {
      case "tool_use":
        return V8.createElement(hP2, {
            param: I,
            costUSD: G,
            durationMs: Z,
            addMargin: d,
            tools: W,
            debug: B,
            verbose: w,
            erroredToolUseIDs: V,
            inProgressToolUseIDs: C,
            unresolvedToolUseIDs: X,
            shouldAnimate: Y,
            shouldShowDot: A
        });

      case "text":
        return V8.createElement(Yu2, {
            param: I,
            costUSD: G,
            durationMs: Z,
            debug: B,
            addMargin: d,
            shouldShowDot: A,
            verbose: w,
            width: D
        });

      case "redacted_thinking":
        return V8.createElement(Fu2, {
            addMargin: d
        });

      case "thinking":
        return V8.createElement(Du2, {
            addMargin: d,
            param: I
        });

      default:
        return W0(`Unable to render message type: ${I.type}`), null;
    }
}

var a4 = A1(u1(), 1), qJ = A1(u1(), 1);

import {
    randomUUID as UE3
} from "crypto";

var b01 = 7;

function Ju2({
    erroredToolUseIDs: I,
    messages: G,
    onSelect: Z,
    onEscape: d,
    tools: W,
    unresolvedToolUseIDs: B
}) {
    let w = qJ.useMemo(UE3, []);
    qJ.useEffect(() => {
        B0("tengu_message_selector_opened", {});
    }, []);
    function V(z) {
        let Q = G.length - 1 - G.indexOf(z);
        B0("tengu_message_selector_selected", {
            index_from_end: Q.toString(),
            message_type: z.type,
            is_current_prompt: (z.uuid === w).toString()
        }), Z(z);
    }
    function C() {
        B0("tengu_message_selector_cancelled", {}), d();
    }
    let X = qJ.useMemo(() => [ ...G.filter(z => !(z.type === "user" && Array.isArray(z.message.content) && z.message.content[0]?.type === "tool_result")).filter(z => z.type !== "assistant"), {
        ...h9({
            content: "",
            surface: "both"
        }),
        uuid: w
    } ], [ G, w ]), [ Y, A ] = qJ.useState(X.length - 1), D = z6(() => process.exit(0));
    _4((z, Q) => {
        if (Q.tab || Q.escape) {
            C();
            return;
        }
        if (Q.return) {
            V(X[Y]);
            return;
        }
        if (Q.upArrow) if (Q.ctrl || Q.shift || Q.meta) A(0); else A(M => Math.max(0, M - 1));
        if (Q.downArrow) if (Q.ctrl || Q.shift || Q.meta) A(X.length - 1); else A(M => Math.min(X.length - 1, M + 1));
        let U = Number(z);
        if (!isNaN(U) && U >= 1 && U <= Math.min(9, X.length)) {
            if (!X[U - 1]) return;
            V(X[U - 1]);
        }
    });
    let J = Math.max(0, Math.min(Y - Math.floor(b01 / 2), X.length - b01)), K = qJ.useMemo(() => Zd(G).filter(v01), [ G ]);
    return a4.createElement(a4.Fragment, null, a4.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: e1().secondaryBorder,
        height: 4 + Math.min(b01, X.length) * 2,
        paddingX: 1,
        marginTop: 1
    }, a4.createElement(p, {
        flexDirection: "column",
        minHeight: 2,
        marginBottom: 1
    }, a4.createElement(O, {
        bold: !0
    }, "Jump to a previous message"), a4.createElement(O, {
        dimColor: !0
    }, "This will fork the conversation")), X.slice(J, J + b01).map((z, Q) => {
        let M = J + Q === Y, S = z.uuid === w;
        return a4.createElement(p, {
            key: z.uuid,
            flexDirection: "row",
            height: 2,
            minHeight: 2
        }, a4.createElement(p, {
            width: 7
        }, M ? a4.createElement(O, {
            color: "blue",
            bold: !0
        }, Y3.pointer, " ", J + Q + 1, " ") : a4.createElement(O, null, "  ", J + Q + 1, " ")), a4.createElement(p, {
            height: 1,
            overflow: "hidden",
            width: 100
        }, S ? a4.createElement(p, {
            width: "100%"
        }, a4.createElement(O, {
            dimColor: !0,
            italic: !0
        }, "(current)")) : Array.isArray(z.message.content) && z.message.content[0]?.type === "text" && M01(z.message.content[0].text) ? a4.createElement(O, {
            dimColor: !0,
            italic: !0
        }, "(empty message)") : a4.createElement(SN, {
            message: z,
            messages: K,
            addMargin: !1,
            tools: W,
            verbose: !1,
            debug: !1,
            erroredToolUseIDs: I,
            inProgressToolUseIDs: new Set(),
            unresolvedToolUseIDs: B,
            shouldAnimate: !1,
            shouldShowDot: !1
        })));
    })), a4.createElement(p, {
        marginLeft: 3
    }, a4.createElement(O, {
        dimColor: !0
    }, D.pending ? a4.createElement(a4.Fragment, null, "Press ", D.keyName, " again to exit") : a4.createElement(a4.Fragment, null, "↑/↓ to select · Enter to confirm · Tab/Esc to cancel"))));
}

var Mv1 = A1(u1(), 1);

var cX = A1(u1(), 1);

import {
    basename as uL3,
    extname as yL3
} from "path";

var Ku2 = A1(u1(), 1);

function x6(I) {
    B0("tengu_unary_event", {
        event: I.event,
        completion_type: I.completion_type,
        language_name: I.metadata.language_name,
        message_id: I.metadata.message_id,
        platform: I.metadata.platform
    });
}

function gJ(I, G) {
    Ku2.useEffect(() => {
        B0("tengu_tool_use_show_permission_request", {
            messageID: I.assistantMessage.message.id,
            toolName: I.tool.name
        }), Promise.resolve(G.language_name).then(d => {
            x6({
                completion_type: G.completion_type,
                event: "response",
                metadata: {
                    language_name: d,
                    message_id: I.assistantMessage.message.id,
                    platform: P2.platform
                }
            });
        });
    }, [ I, G ]);
}

var Jb = A1(u1(), 1);

var zu2 = "WebFetchTool", Qu2 = `
- Fetches content from a specified URL and processes it using an AI model
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to markdown
- Processes the content with the prompt using a small, fast model
- Returns the model's response about the content
- Use this tool when you need to retrieve and analyze web content

Usage notes:
  - The URL must be a valid HTTPS URL
  - The prompt should describe what information you want to extract from the page
  - This tool is read-only and does not modify any files
  - Results may be summarized if the content is very large
`;

function Nu2(I, G) {
    return `
Web page content:
---
${I}
---

${G}

Provide a concise response based only on the content above.
`;
}

var km2 = A1(lm2(), 1);

function RL3(I) {
    if (I.length > 1e3) return !1;
    let G;
    try {
        G = new URL(I);
    } catch {
        return !1;
    }
    if (G.protocol !== "https:") return !1;
    if (G.username || G.password) return !1;
    if (G.hostname.split(".").length < 2) return !1;
    return !0;
}

async function xm2(I, G) {
    if (!RL3(I)) throw new Error("Invalid URL");
    try {} catch (w) {
        W0(w);
    }
    let Z = await fetch(I, {
        signal: G.signal,
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ClaudeCode/1.0)"
        },
        redirect: "error"
    });
    if (!Z.ok) throw new Error(`Failed to fetch URL: ${Z.status} ${Z.statusText}`);
    let d = Z.headers.get("content-type") ?? "", W = await Z.text(), B;
    if (d.includes("text/html")) B = new km2.default().turndown(W); else B = W;
    if (B.length > 1e5) B = B.substring(0, 1e5) + "...[content truncated]";
    return B;
}

async function hm2(I, G) {
    let Z = Nu2(I, G), d = await oZ({
        systemPrompt: [],
        userPrompt: Z
    }), {
        content: W
    } = d.message;
    if (W.length > 0) {
        let B = W[0];
        if ("text" in B) return B.text;
    }
    return "No response from model";
}

var vL3 = e.strictObject({
    url: e.string().url().describe("The URL to fetch content from"),
    prompt: e.string().describe("The prompt to run on the fetched content")
}), OB = {
    name: zu2,
    async description(I) {
        let {
            url: G
        } = I;
        try {
            return `Claude wants to fetch content from ${new URL(G).hostname}`;
        } catch {
            return "Claude wants to fetch content from this URL";
        }
    },
    userFacingName() {
        return "Web Fetch";
    },
    async isEnabled() {
        return !1;
    },
    inputSchema: vL3,
    isReadOnly() {
        return !0;
    },
    needsPermissions(I) {
        return !0;
    },
    async prompt() {
        return Qu2;
    },
    renderToolUseMessage({
        url: I,
        prompt: G
    }, {
        verbose: Z
    }) {
        return `url: "${I}"${Z ? `, prompt: "${G}"` : ""}`;
    },
    renderToolUseRejectedMessage() {
        return Jb.default.createElement(E5, null);
    },
    renderToolResultMessage(I) {
        return Jb.default.createElement(p, {
            justifyContent: "space-between",
            width: "100%"
        }, Jb.default.createElement(Bd, null, Jb.default.createElement(O, {
            bold: !0
        }, I.url)));
    },
    async *call(I, {
        abortController: G
    }) {
        let Z = Date.now(), {
            url: d,
            prompt: W
        } = I;
        try {
            let B = await xm2(d, G), V = {
                result: await hm2(W, B),
                durationMs: Date.now() - Z,
                url: d
            };
            yield {
                type: "result",
                resultForAssistant: this.renderResultForAssistant(V),
                data: V
            };
        } catch (B) {
            W0(B);
            let V = {
                result: `Error: ${B instanceof Error ? B.message : "Unknown error"}`,
                durationMs: Date.now() - Z,
                url: d
            };
            yield {
                type: "result",
                resultForAssistant: this.renderResultForAssistant(V),
                data: V
            };
        }
    },
    renderResultForAssistant(I) {
        return I.result;
    }
};

var gv1 = (I, G) => {
    if (j4.isReadOnly({
        command: I
    })) return !0;
    if (G.includes(AM(j4, {
        command: I
    }, null))) return !0;
    if (G.includes(AM(j4, {
        command: I
    }, I))) return !0;
    return !1;
}, cm2 = (I, G, Z) => {
    if (gv1(I, Z)) return !0;
    return Z.includes(AM(j4, {
        command: I
    }, G));
}, EL3 = async (I, G, Z, d = At) => {
    if (gv1(I, Z)) return {
        result: !0
    };
    let W = wN(I).filter(w => {
        if (w === `cd ${u0()}`) return !1;
        return !0;
    }), B = await d(I, G.abortController.signal);
    if (G.abortController.signal.aborted) throw new NC();
    if (B === null) return {
        result: !1,
        message: `Claude requested permissions to use ${j4.name}, but you haven't granted it yet.`
    };
    if (B.commandInjectionDetected) if (gv1(I, Z)) return {
        result: !0
    }; else return {
        result: !1,
        message: `Claude requested permissions to use ${j4.name}, but you haven't granted it yet.`
    };
    if (W.length < 2) if (cm2(I, B.commandPrefix, Z)) return {
        result: !0
    }; else return {
        result: !1,
        message: `Claude requested permissions to use ${j4.name}, but you haven't granted it yet.`
    };
    if (W.every(w => {
        let V = B.subcommandPrefixes.get(w);
        if (V === void 0 || V.commandInjectionDetected) return !1;
        return cm2(w, V ? V.commandPrefix : null, Z);
    })) return {
        result: !0
    };
    return {
        result: !1,
        message: `Claude requested permissions to use ${j4.name}, but you haven't granted it yet.`
    };
}, EJ = async (I, G, Z, d, W) => {
    if (Z.options.permissionMode === "dangerouslySkipPermissions") return {
        result: !0
    };
    if (Z.abortController.signal.aborted) throw new NC();
    try {
        if (!I.needsPermissions(G, {
            writeFileAllowedDirectories: W
        })) return {
            result: !0
        };
    } catch (V) {
        return W0(`Error checking permissions: ${V}`), {
            result: !1,
            message: "Error checking permissions"
        };
    }
    let w = [ ...E4().allowedTools, ...Z.options.allowedToolsFromCLIFlag ];
    if (I === j4 && w.includes(j4.name)) return {
        result: !0
    };
    switch (I) {
      case j4:
        {
            let {
                command: V
            } = wT.parse(G);
            return await EL3(V, Z, w);
        }

      case DG:
      case y7:
      case HG:
        {
            if (w.includes(AM(I, G, null))) return {
                result: !0
            };
            return {
                result: !1,
                message: `Claude requested permissions to use ${I.name}, but you haven't granted it yet.`
            };
        }

      default:
        {
            let V = AM(I, G, null);
            if (w.includes(V)) return {
                result: !0
            };
            return {
                result: !1,
                message: `Claude requested permissions to use ${I.name}, but you haven't granted it yet.`
            };
        }
    }
};

async function EV(I, G, Z, d) {
    let W = AM(I, G, Z);
    if (I === DG || I === y7 || I === HG) {
        rt(d);
        return;
    }
    let B = E4();
    if (B.allowedTools.includes(W)) return;
    B.allowedTools.push(W), B.allowedTools.sort(), h3(B);
}

function AM(I, G, Z) {
    switch (I) {
      case j4:
        if (Z) return `${j4.name}(${Z}:*)`;
        return `${j4.name}(${j4.renderToolUseMessage(G)})`;

      case OB:
        try {
            let d = OB.inputSchema.safeParse(G);
            if (!d.success) return `${OB.name}(input:${G.toString()})`;
            let {
                url: W
            } = d.data, B = new URL(W).hostname;
            return `${OB.name}(domain:${B})`;
        } catch {
            return `${OB.name}(input:${G.toString()})`;
        }

      default:
        return I.name;
    }
}

var A_ = A1(u1(), 1);

function pm2(I) {
    return I >= 70 ? "high" : I >= 30 ? "moderate" : "low";
}

function ML3(I) {
    let G = e1();
    switch (I) {
      case "low":
        return {
            highlightColor: G.success,
            textColor: G.permission
        };

      case "moderate":
        return {
            highlightColor: G.warning,
            textColor: G.warning
        };

      case "high":
        return {
            highlightColor: G.error,
            textColor: G.error
        };
    }
}

function __(I) {
    if (I === null) return e1().permission;
    let G = pm2(I);
    return ML3(G).textColor;
}

function $L3({
    riskScore: I
}) {
    let G = pm2(I);
    return A_.createElement(O, {
        color: __(I)
    }, "Risk: ", G);
}

function mB({
    title: I,
    riskScore: G
}) {
    return A_.createElement(p, {
        flexDirection: "column"
    }, A_.createElement(O, {
        bold: !0,
        color: e1().permission
    }, I), G !== null && A_.createElement($L3, {
        riskScore: G
    }));
}

var BW = A1(u1(), 1), Uv1 = A1(u1(), 1);

import {
    existsSync as SL3,
    readFileSync as LL3
} from "fs";

import {
    relative as PL3
} from "path";

function fv1({
    file_path: I,
    new_string: G,
    old_string: Z,
    verbose: d,
    useBorder: W = !0,
    width: B
}) {
    let w = Uv1.useMemo(() => SL3(I) ? LL3(I, "utf8") : "", [ I ]), V = Uv1.useMemo(() => G_({
        filePath: I,
        fileContents: w,
        oldStr: Z,
        newStr: G
    }), [ I, w, Z, G ]);
    return BW.createElement(p, {
        flexDirection: "column"
    }, BW.createElement(p, {
        borderColor: e1().secondaryBorder,
        borderStyle: W ? "round" : void 0,
        flexDirection: "column",
        paddingX: 1
    }, BW.createElement(p, {
        paddingBottom: 1
    }, BW.createElement(O, {
        bold: !0
    }, d ? I : PL3(u0(), I))), vB(V.map(C => BW.createElement(EB, {
        key: C.newStart,
        patch: C,
        dim: !1,
        width: B
    })), C => BW.createElement(O, {
        color: e1().secondaryText,
        key: `ellipsis-${C}`
    }, "..."))));
}

function OL3(I) {
    let G = at(I) ? [ {
        label: "Yes, and don't ask again this session",
        value: "yes-dont-ask-again"
    } ] : [];
    return [ {
        label: "Yes",
        value: "yes"
    }, ...G, {
        label: `No, and tell Claude what to do differently (${T0.bold.hex(e1().warning)("esc")})`,
        value: "no"
    } ];
}

function im2({
    setWriteFileAllowedDirectories: I,
    toolUseConfirm: G,
    onDone: Z,
    verbose: d
}) {
    let {
        columns: W
    } = Q5(), {
        file_path: B,
        new_string: w,
        old_string: V
    } = G.input, C = cX.useMemo(() => ({
        completion_type: "str_replace_single",
        language_name: q21(B)
    }), [ B ]);
    return gJ(G, C), cX.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: __(G.riskScore),
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, cX.default.createElement(mB, {
        title: "Edit file",
        riskScore: G.riskScore
    }), cX.default.createElement(fv1, {
        file_path: B,
        new_string: w,
        old_string: V,
        verbose: d,
        width: W - 12
    }), cX.default.createElement(p, {
        flexDirection: "column"
    }, cX.default.createElement(O, null, "Do you want to make this edit to", " ", cX.default.createElement(O, {
        bold: !0
    }, uL3(B)), "?"), cX.default.createElement(f7, {
        options: OL3(B),
        onChange: X => {
            switch (X) {
              case "yes":
                q21(B).then(Y => {
                    x6({
                        completion_type: "str_replace_single",
                        event: "accept",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), Z(), G.onAllow("temporary");
                break;

              case "yes-dont-ask-again":
                q21(B).then(Y => {
                    x6({
                        completion_type: "str_replace_single",
                        event: "accept",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), EV(G.tool, G.input, pX(G), I).then(() => {
                    Z(), G.onAllow("permanent");
                });
                break;

              case "no":
                q21(B).then(Y => {
                    x6({
                        completion_type: "str_replace_single",
                        event: "reject",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), Z(), G.onReject();
                break;
            }
        }
    })));
}

async function q21(I) {
    let G = yL3(I);
    if (!G) return "unknown";
    return (await Promise.resolve().then(() => A1(CE(), 1))).default.getLanguage(G.slice(1))?.name ?? "unknown";
}

var MV = A1(u1(), 1);

var nm2 = A1(u1(), 1);

function g21(I, G) {
    nm2.useEffect(() => {
        B0("tengu_tool_use_show_permission_request", {
            messageID: I.assistantMessage.message.id,
            toolName: I.tool.name
        }), Promise.resolve(G.language_name).then(d => {
            x6({
                completion_type: G.completion_type,
                event: "response",
                metadata: {
                    language_name: d,
                    message_id: I.assistantMessage.message.id,
                    platform: P2.platform
                }
            });
        });
    }, [ I, G ]);
}

function H_(I, {
    assistantMessage: {
        message: {
            id: G
        }
    }
}, Z) {
    x6({
        completion_type: I,
        event: Z,
        metadata: {
            language_name: "none",
            message_id: G,
            platform: P2.platform
        }
    });
}

function am2({
    toolUseConfirm: I,
    command: G
}) {
    let Z = !oF2(G) && I.commandPrefix && !I.commandPrefix.commandInjectionDetected, d = pX(I), W = Z && d !== null, B = [];
    if (W) B = [ {
        label: `Yes, and don't ask again for ${T0.bold(d)} commands in ${T0.bold(u0())}`,
        value: "yes-dont-ask-again-prefix"
    } ]; else if (Z) B = [ {
        label: `Yes, and don't ask again for ${T0.bold(G)} commands in ${T0.bold(u0())}`,
        value: "yes-dont-ask-again-full"
    } ];
    return [ {
        label: "Yes",
        value: "yes"
    }, ...B, {
        label: `No, and tell Claude what to do differently (${T0.bold.hex(e1().warning)("esc")})`,
        value: "no"
    } ];
}

function rm2({
    setWriteFileAllowedDirectories: I,
    toolUseConfirm: G,
    onDone: Z
}) {
    let d = e1(), {
        command: W
    } = j4.inputSchema.parse(G.input), B = MV.useMemo(() => ({
        completion_type: "tool_use_single",
        language_name: "none"
    }), []);
    return g21(G, B), MV.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: d.permission,
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, MV.default.createElement(mB, {
        title: "Bash command",
        riskScore: G.riskScore
    }), MV.default.createElement(p, {
        flexDirection: "column",
        paddingX: 2,
        paddingY: 1
    }, MV.default.createElement(O, null, j4.renderToolUseMessage({
        command: W
    })), MV.default.createElement(O, {
        color: d.secondaryText
    }, G.description)), MV.default.createElement(p, {
        flexDirection: "column"
    }, MV.default.createElement(O, null, "Do you want to proceed?"), MV.default.createElement(tI, {
        options: am2({
            toolUseConfirm: G,
            command: W
        }),
        onChange: w => {
            switch (w) {
              case "yes":
                H_("tool_use_single", G, "accept"), G.onAllow("temporary"), Z();
                break;

              case "yes-dont-ask-again-prefix":
                {
                    let V = pX(G);
                    if (V !== null) H_("tool_use_single", G, "accept"), EV(G.tool, G.input, V, I).then(() => {
                        G.onAllow("permanent"), Z();
                    });
                    break;
                }

              case "yes-dont-ask-again-full":
                H_("tool_use_single", G, "accept"), EV(G.tool, G.input, null, I).then(() => {
                    G.onAllow("permanent"), Z();
                });
                break;

              case "no":
                H_("tool_use_single", G, "reject"), G.onReject(), Z();
                break;
            }
        }
    })));
}

var TB = A1(u1(), 1);

function U21({
    setWriteFileAllowedDirectories: I,
    toolUseConfirm: G,
    onDone: Z,
    verbose: d
}) {
    let W = e1(), B = G.tool.userFacingName(G.input), w = B.endsWith(" (MCP)") ? B.slice(0, -6) : B, V = TB.useMemo(() => ({
        completion_type: "tool_use_single",
        language_name: "none"
    }), []);
    return gJ(G, V), TB.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: __(G.riskScore),
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, TB.default.createElement(mB, {
        title: "Tool use",
        riskScore: G.riskScore
    }), TB.default.createElement(p, {
        flexDirection: "column",
        paddingX: 2,
        paddingY: 1
    }, TB.default.createElement(O, null, w, "(", G.tool.renderToolUseMessage(G.input, {
        verbose: d
    }), ")", B.endsWith(" (MCP)") ? TB.default.createElement(O, {
        color: W.secondaryText
    }, " (MCP)") : ""), TB.default.createElement(O, {
        color: W.secondaryText
    }, G.description)), TB.default.createElement(p, {
        flexDirection: "column"
    }, TB.default.createElement(O, null, "Do you want to proceed?"), TB.default.createElement(f7, {
        options: [ {
            label: "Yes",
            value: "yes"
        }, {
            label: `Yes, and don't ask again for ${T0.bold(w)} commands in ${T0.bold(u0())}`,
            value: "yes-dont-ask-again"
        }, {
            label: `No, and tell Claude what to do differently (${T0.bold.hex(e1().warning)("esc")})`,
            value: "no"
        } ],
        onChange: C => {
            switch (C) {
              case "yes":
                x6({
                    completion_type: "tool_use_single",
                    event: "accept",
                    metadata: {
                        language_name: "none",
                        message_id: G.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), G.onAllow("temporary"), Z();
                break;

              case "yes-dont-ask-again":
                x6({
                    completion_type: "tool_use_single",
                    event: "accept",
                    metadata: {
                        language_name: "none",
                        message_id: G.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), EV(G.tool, G.input, pX(G), I).then(() => {
                    G.onAllow("permanent"), Z();
                });
                break;

              case "no":
                x6({
                    completion_type: "tool_use_single",
                    event: "reject",
                    metadata: {
                        language_name: "none",
                        message_id: G.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), G.onReject(), Z();
                break;
            }
        }
    })));
}

var Rv1 = A1(u1(), 1);

var mL3 = 6e3;

function TL3() {
    return Date.now() - tp1();
}

function bL3(I) {
    return TL3() < I;
}

function jL3(I) {
    return !bL3(I);
}

var lL3 = x2(() => process.stdin.on("data", T61));

function vv1(I, G = mL3) {
    Rv1.useEffect(() => {
        lL3(), T61();
    }, []), Rv1.useEffect(() => {
        let Z = !1, d = setInterval(() => {
            if (jL3(G) && !Z) Z = !0, G01({
                message: I
            });
        }, G);
        return () => clearTimeout(d);
    }, [ I, G ]);
}

var bB = A1(u1(), 1);

import {
    basename as pL3,
    extname as iL3
} from "path";

import {
    existsSync as nL3
} from "fs";

var wW = A1(u1(), 1), f21 = A1(u1(), 1);

import {
    existsSync as kL3,
    readFileSync as xL3
} from "fs";

import {
    extname as hL3,
    relative as cL3
} from "path";

function Ev1({
    file_path: I,
    content: G,
    verbose: Z,
    width: d
}) {
    let W = f21.useMemo(() => kL3(I), [ I ]), B = f21.useMemo(() => {
        if (!W) return "";
        let V = pG(I);
        return xL3(I, V);
    }, [ I, W ]), w = f21.useMemo(() => {
        if (!W) return null;
        return G_({
            filePath: I,
            fileContents: B,
            oldStr: B,
            newStr: G
        });
    }, [ W, I, B, G ]);
    return wW.createElement(p, {
        borderColor: e1().secondaryBorder,
        borderStyle: "round",
        flexDirection: "column",
        paddingX: 1
    }, wW.createElement(p, {
        paddingBottom: 1
    }, wW.createElement(O, {
        bold: !0
    }, Z ? I : cL3(u0(), I))), w ? vB(w.map(V => wW.createElement(EB, {
        key: V.newStart,
        patch: V,
        dim: !1,
        width: d
    })), V => wW.createElement(O, {
        color: e1().secondaryText,
        key: `ellipsis-${V}`
    }, "...")) : wW.createElement(SX, {
        code: G || "(No content)",
        language: hL3(I).slice(1)
    }));
}

function sm2({
    setWriteFileAllowedDirectories: I,
    toolUseConfirm: G,
    onDone: Z,
    verbose: d
}) {
    let {
        file_path: W,
        content: B
    } = G.input, w = bB.useMemo(() => nL3(W), [ W ]), V = bB.useMemo(() => ({
        completion_type: "write_file_single",
        language_name: R21(W)
    }), [ W ]), {
        columns: C
    } = Q5();
    return gJ(G, V), bB.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: __(G.riskScore),
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, bB.default.createElement(mB, {
        title: `${w ? "Edit" : "Create"} file`,
        riskScore: G.riskScore
    }), bB.default.createElement(p, {
        flexDirection: "column"
    }, bB.default.createElement(Ev1, {
        file_path: W,
        content: B,
        verbose: d,
        width: C - 12
    })), bB.default.createElement(p, {
        flexDirection: "column"
    }, bB.default.createElement(O, null, "Do you want to ", w ? "make this edit to" : "create", " ", bB.default.createElement(O, {
        bold: !0
    }, pL3(W)), "?"), bB.default.createElement(f7, {
        options: [ {
            label: "Yes",
            value: "yes"
        }, {
            label: "Yes, and don't ask again this session",
            value: "yes-dont-ask-again"
        }, {
            label: `No, and tell Claude what to do differently (${T0.bold.hex(e1().warning)("esc")})`,
            value: "no"
        } ],
        onChange: X => {
            switch (X) {
              case "yes":
                R21(W).then(Y => {
                    x6({
                        completion_type: "write_file_single",
                        event: "accept",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), G.onAllow("temporary"), Z();
                break;

              case "yes-dont-ask-again":
                R21(W).then(Y => {
                    x6({
                        completion_type: "write_file_single",
                        event: "accept",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), EV(G.tool, G.input, pX(G), I).then(() => {
                    G.onAllow("permanent"), Z();
                });
                break;

              case "no":
                R21(W).then(Y => {
                    x6({
                        completion_type: "write_file_single",
                        event: "reject",
                        metadata: {
                            language_name: Y,
                            message_id: G.assistantMessage.message.id,
                            platform: P2.platform
                        }
                    });
                }), G.onReject(), Z();
                break;
            }
        }
    })));
}

async function R21(I) {
    let G = iL3(I);
    if (!G) return "unknown";
    return (await Promise.resolve().then(() => A1(CE(), 1))).default.getLanguage(G.slice(1))?.name ?? "unknown";
}

var jB = A1(u1(), 1);

import {
    existsSync as aL3,
    statSync as rL3
} from "fs";

function sL3(I) {
    let G = I.tool;
    if ("getPath" in G && typeof G.getPath === "function") try {
        return G.getPath(I.input);
    } catch {
        return null;
    }
    return null;
}

function oL3(I) {
    let G = LX(I);
    try {
        return aL3(G) && rL3(G).isFile();
    } catch {
        return !1;
    }
}

function om2({
    toolUseConfirm: I,
    onDone: G,
    verbose: Z,
    setWriteFileAllowedDirectories: d
}) {
    let W = sL3(I);
    if (!W) return jB.default.createElement(U21, {
        setWriteFileAllowedDirectories: d,
        toolUseConfirm: I,
        onDone: G,
        verbose: Z
    });
    return jB.default.createElement(tL3, {
        toolUseConfirm: I,
        path: W,
        onDone: G,
        verbose: Z,
        setWriteFileAllowedDirectories: d
    });
}

function eL3(I, G) {
    if (I.tool.isReadOnly(I.input)) return [];
    return at(G) ? [ {
        label: "Yes, and don't ask again for file edits this session",
        value: "yes-dont-ask-again"
    } ] : [];
}

function tL3({
    toolUseConfirm: I,
    path: G,
    onDone: Z,
    verbose: d,
    setWriteFileAllowedDirectories: W
}) {
    let B = I.tool.userFacingName(I.input), V = `${I.tool.isReadOnly(I.input) ? "Read" : "Edit"} ${oL3(G) ? "files" : "file"}`, C = jB.useMemo(() => ({
        completion_type: "tool_use_single",
        language_name: "none"
    }), []);
    return gJ(I, C), jB.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: __(I.riskScore),
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, jB.default.createElement(mB, {
        title: V,
        riskScore: I.riskScore
    }), jB.default.createElement(p, {
        flexDirection: "column",
        paddingX: 2,
        paddingY: 1
    }, jB.default.createElement(O, null, B, "(", I.tool.renderToolUseMessage(I.input, {
        verbose: d
    }), ")")), jB.default.createElement(p, {
        flexDirection: "column"
    }, jB.default.createElement(O, null, "Do you want to proceed?"), jB.default.createElement(f7, {
        options: [ {
            label: "Yes",
            value: "yes"
        }, ...eL3(I, G), {
            label: `No, and tell Claude what to do differently (${T0.bold.hex(e1().warning)("esc")})`,
            value: "no"
        } ],
        onChange: X => {
            switch (X) {
              case "yes":
                x6({
                    completion_type: "tool_use_single",
                    event: "accept",
                    metadata: {
                        language_name: "none",
                        message_id: I.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), I.onAllow("temporary"), Z();
                break;

              case "yes-dont-ask-again":
                x6({
                    completion_type: "tool_use_single",
                    event: "accept",
                    metadata: {
                        language_name: "none",
                        message_id: I.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), rt(W), I.onAllow("permanent"), Z();
                break;

              case "no":
                x6({
                    completion_type: "tool_use_single",
                    event: "reject",
                    metadata: {
                        language_name: "none",
                        message_id: I.assistantMessage.message.id,
                        platform: P2.platform
                    }
                }), I.onReject(), Z();
                break;
            }
        }
    })));
}

var $V = A1(u1(), 1);

function em2({
    setWriteFileAllowedDirectories: I,
    toolUseConfirm: G,
    onDone: Z,
    verbose: d
}) {
    let W = e1(), {
        url: B
    } = G.input, w = new URL(B).hostname, V = $V.useMemo(() => ({
        completion_type: "tool_use_single",
        language_name: "none"
    }), []);
    g21(G, V);
    let C = [ {
        label: "Yes",
        value: "yes"
    }, {
        label: `Yes, and don't ask again for ${T0.bold(w)}`,
        value: "yes-dont-ask-again-domain"
    }, {
        label: `No, and tell Claude what to do differently (${T0.bold.hex(W.warning)("esc")})`,
        value: "no"
    } ];
    return $V.default.createElement(p, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: W.permission,
        marginTop: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingBottom: 1
    }, $V.default.createElement(mB, {
        title: "Web fetch",
        riskScore: G.riskScore
    }), $V.default.createElement(p, {
        flexDirection: "column",
        paddingX: 2,
        paddingY: 1
    }, $V.default.createElement(O, null, OB.renderToolUseMessage(G.input, {
        verbose: d
    })), $V.default.createElement(O, {
        color: W.secondaryText
    }, G.description)), $V.default.createElement(p, {
        flexDirection: "column"
    }, $V.default.createElement(O, null, "Do you want to allow Claude to fetch this content?"), $V.default.createElement(tI, {
        options: C,
        onChange: X => {
            switch (X) {
              case "yes":
                H_("tool_use_single", G, "accept"), G.onAllow("temporary"), Z();
                break;

              case "yes-dont-ask-again-domain":
                H_("tool_use_single", G, "accept"), EV(G.tool, G.input, null, I).then(() => {
                    G.onAllow("permanent"), Z();
                });
                break;

              case "no":
                H_("tool_use_single", G, "reject"), G.onReject(), Z();
                break;
            }
        }
    })));
}

function IP3(I) {
    switch (I) {
      case DG:
        return im2;

      case y7:
        return sm2;

      case j4:
        return rm2;

      case OB:
        return em2;

      case W7:
      case CZ:
      case fI:
      case _G:
      case YV:
      case HG:
        return om2;

      default:
        return U21;
    }
}

function pX(I) {
    return I.commandPrefix && !I.commandPrefix.commandInjectionDetected && I.commandPrefix.commandPrefix || null;
}

function tm2({
    toolUseConfirm: I,
    onDone: G,
    verbose: Z,
    setWriteFileAllowedDirectories: d
}) {
    _4((w, V) => {
        if (V.ctrl && w === "c") G(), I.onReject();
    });
    let W = I.tool.userFacingName(I.input);
    vv1(`Claude needs your permission to use ${W}`);
    let B = IP3(I.tool);
    return Mv1.createElement(B, {
        toolUseConfirm: I,
        onDone: G,
        verbose: Z,
        setWriteFileAllowedDirectories: d
    });
}

import {
    exec as GP3
} from "child_process";

import {
    promisify as ZP3
} from "util";

var IT2 = ZP3(GP3);

async function dP3() {
    if (P2.platform === "windows") return [];
    if (!await ZJ()) return [];
    try {
        let I = "", {
            stdout: G
        } = await IT2("git log -n 1000 --pretty=format: --name-only --diff-filter=M --author=$(git config user.email) | sort | uniq -c | sort -nr | head -n 20", {
            cwd: u0(),
            encoding: "utf8"
        });
        if (I = `Files modified by user:
` + G, G.split(`
`).length < 10) {
            let {
                stdout: B
            } = await IT2("git log -n 1000 --pretty=format: --name-only --diff-filter=M | sort | uniq -c | sort -nr | head -n 20", {
                cwd: u0(),
                encoding: "utf8"
            });
            I += `

Files modified by other users:
` + B;
        }
        let d = (await oZ({
            systemPrompt: [ "You are an expert at analyzing git history. Given a list of files and their modification counts, return exactly five filenames that are frequently modified and represent core application logic (not auto-generated files, dependencies, or configuration). Make sure filenames are diverse, not all in the same folder, and are a mix of user and other users. Return only the filenames' basenames (without the path) separated by newlines with no explanation." ],
            userPrompt: I
        })).message.content[0];
        if (!d || d.type !== "text") return [];
        let W = d.text.trim().split(`
`);
        if (W.length < 5) return [];
        return W;
    } catch (I) {
        return W0(I), [];
    }
}

var v21 = x2(async () => {
    let I = E4(), G = Date.now(), Z = I.exampleFilesGeneratedAt ?? 0, d = 6048e5;
    if (G - Z > 6048e5) I.exampleFiles = [];
    if (!I.exampleFiles?.length) dP3().then(B => {
        if (B.length) h3({
            ...E4(),
            exampleFiles: B,
            exampleFilesGeneratedAt: Date.now()
        });
    });
    let W = I.exampleFiles?.length ? cK(I.exampleFiles) : "<filepath>";
    return [ "fix lint errors", "fix typecheck errors", `how does ${W} work?`, `refactor ${W}`, "how do I log an error?", `edit ${W} to...`, `write a test for ${W}`, "create a util logging.py that..." ];
});

var X8 = A1(u1(), 1);

var Sv1 = A1(u1(), 1);

var WP3 = 100;

function $v1() {
    return E4().history ?? [];
}

function MJ(I) {
    let G = E4(), Z = G.history ?? [];
    if (Z[0] === I) return;
    Z.unshift(I), h3({
        ...G,
        history: Z.slice(0, WP3)
    });
}

function GT2(I, G) {
    let [ Z, d ] = Sv1.useState(0), [ W, B ] = Sv1.useState(""), w = Y => {
        if (Y !== void 0) {
            let A = Y.startsWith("!") ? "bash" : "prompt", D = A === "bash" || A === "memory" ? Y.slice(1) : Y;
            I(D, A);
        }
    };
    function V() {
        let Y = $v1();
        if (Z < Y.length) {
            if (Z === 0 && G.trim() !== "") B(G);
            let A = Z + 1;
            d(A), w(Y[Z]);
        }
    }
    function C() {
        let Y = $v1();
        if (Z > 1) {
            let A = Z - 1;
            d(A), w(Y[A - 1]);
        } else if (Z === 1) d(0), w(W);
    }
    function X() {
        B(""), d(0);
    }
    return {
        historyIndex: Z,
        setHistoryIndex: d,
        onHistoryUp: V,
        onHistoryDown: C,
        resetHistory: X
    };
}

var Kb = A1(u1(), 1);

function D_(I) {
    return !Array.isArray ? XT2(I) === "[object Array]" : Array.isArray(I);
}

var BP3 = 1 / 0;

function wP3(I) {
    if (typeof I == "string") return I;
    let G = I + "";
    return G == "0" && 1 / I == -BP3 ? "-0" : G;
}

function VP3(I) {
    return I == null ? "" : wP3(I);
}

function iX(I) {
    return typeof I === "string";
}

function VT2(I) {
    return typeof I === "number";
}

function CP3(I) {
    return I === !0 || I === !1 || XP3(I) && XT2(I) == "[object Boolean]";
}

function CT2(I) {
    return typeof I === "object";
}

function XP3(I) {
    return CT2(I) && I !== null;
}

function VW(I) {
    return I !== void 0 && I !== null;
}

function Lv1(I) {
    return !I.trim().length;
}

function XT2(I) {
    return I == null ? I === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(I);
}

var YP3 = "Incorrect 'index' type", AP3 = I => `Invalid value for key ${I}`, _P3 = I => `Pattern length exceeds max of ${I}.`, HP3 = I => `Missing ${I} property in key`, DP3 = I => `Property 'weight' in key '${I}' must be a positive integer`, ZT2 = Object.prototype.hasOwnProperty;

class YT2 {
    constructor(I) {
        this._keys = [], this._keyMap = {};
        let G = 0;
        I.forEach(Z => {
            let d = AT2(Z);
            this._keys.push(d), this._keyMap[d.id] = d, G += d.weight;
        }), this._keys.forEach(Z => {
            Z.weight /= G;
        });
    }
    get(I) {
        return this._keyMap[I];
    }
    keys() {
        return this._keys;
    }
    toJSON() {
        return JSON.stringify(this._keys);
    }
}

function AT2(I) {
    let G = null, Z = null, d = null, W = 1, B = null;
    if (iX(I) || D_(I)) d = I, G = dT2(I), Z = Pv1(I); else {
        if (!ZT2.call(I, "name")) throw new Error(HP3("name"));
        let w = I.name;
        if (d = w, ZT2.call(I, "weight")) {
            if (W = I.weight, W <= 0) throw new Error(DP3(w));
        }
        G = dT2(w), Z = Pv1(w), B = I.getFn;
    }
    return {
        path: G,
        id: Z,
        weight: W,
        src: d,
        getFn: B
    };
}

function dT2(I) {
    return D_(I) ? I : I.split(".");
}

function Pv1(I) {
    return D_(I) ? I.join(".") : I;
}

function FP3(I, G) {
    let Z = [], d = !1, W = (B, w, V) => {
        if (!VW(B)) return;
        if (!w[V]) Z.push(B); else {
            let C = w[V], X = B[C];
            if (!VW(X)) return;
            if (V === w.length - 1 && (iX(X) || VT2(X) || CP3(X))) Z.push(VP3(X)); else if (D_(X)) {
                d = !0;
                for (let Y = 0, A = X.length; Y < A; Y += 1) W(X[Y], w, V + 1);
            } else if (w.length) W(X, w, V + 1);
        }
    };
    return W(I, iX(G) ? G.split(".") : G, 0), d ? Z : Z[0];
}

var JP3 = {
    includeMatches: !1,
    findAllMatches: !1,
    minMatchCharLength: 1
}, KP3 = {
    isCaseSensitive: !1,
    includeScore: !1,
    keys: [],
    shouldSort: !0,
    sortFn: (I, G) => I.score === G.score ? I.idx < G.idx ? -1 : 1 : I.score < G.score ? -1 : 1
}, zP3 = {
    location: 0,
    threshold: .6,
    distance: 100
}, QP3 = {
    useExtendedSearch: !1,
    getFn: FP3,
    ignoreLocation: !1,
    ignoreFieldNorm: !1,
    fieldNormWeight: 1
}, h4 = {
    ...KP3,
    ...JP3,
    ...zP3,
    ...QP3
}, NP3 = /[^ ]+/g;

function qP3(I = 1, G = 3) {
    let Z = new Map(), d = Math.pow(10, G);
    return {
        get(W) {
            let B = W.match(NP3).length;
            if (Z.has(B)) return Z.get(B);
            let w = 1 / Math.pow(B, .5 * I), V = parseFloat(Math.round(w * d) / d);
            return Z.set(B, V), V;
        },
        clear() {
            Z.clear();
        }
    };
}

class $21 {
    constructor({
        getFn: I = h4.getFn,
        fieldNormWeight: G = h4.fieldNormWeight
    } = {}) {
        this.norm = qP3(G, 3), this.getFn = I, this.isCreated = !1, this.setIndexRecords();
    }
    setSources(I = []) {
        this.docs = I;
    }
    setIndexRecords(I = []) {
        this.records = I;
    }
    setKeys(I = []) {
        this.keys = I, this._keysMap = {}, I.forEach((G, Z) => {
            this._keysMap[G.id] = Z;
        });
    }
    create() {
        if (this.isCreated || !this.docs.length) return;
        if (this.isCreated = !0, iX(this.docs[0])) this.docs.forEach((I, G) => {
            this._addString(I, G);
        }); else this.docs.forEach((I, G) => {
            this._addObject(I, G);
        });
        this.norm.clear();
    }
    add(I) {
        let G = this.size();
        if (iX(I)) this._addString(I, G); else this._addObject(I, G);
    }
    removeAt(I) {
        this.records.splice(I, 1);
        for (let G = I, Z = this.size(); G < Z; G += 1) this.records[G].i -= 1;
    }
    getValueForItemAtKeyId(I, G) {
        return I[this._keysMap[G]];
    }
    size() {
        return this.records.length;
    }
    _addString(I, G) {
        if (!VW(I) || Lv1(I)) return;
        let Z = {
            v: I,
            i: G,
            n: this.norm.get(I)
        };
        this.records.push(Z);
    }
    _addObject(I, G) {
        let Z = {
            i: G,
            $: {}
        };
        this.keys.forEach((d, W) => {
            let B = d.getFn ? d.getFn(I) : this.getFn(I, d.path);
            if (!VW(B)) return;
            if (D_(B)) {
                let w = [], V = [ {
                    nestedArrIndex: -1,
                    value: B
                } ];
                while (V.length) {
                    let {
                        nestedArrIndex: C,
                        value: X
                    } = V.pop();
                    if (!VW(X)) continue;
                    if (iX(X) && !Lv1(X)) {
                        let Y = {
                            v: X,
                            i: C,
                            n: this.norm.get(X)
                        };
                        w.push(Y);
                    } else if (D_(X)) X.forEach((Y, A) => {
                        V.push({
                            nestedArrIndex: A,
                            value: Y
                        });
                    });
                }
                Z.$[W] = w;
            } else if (iX(B) && !Lv1(B)) {
                let w = {
                    v: B,
                    n: this.norm.get(B)
                };
                Z.$[W] = w;
            }
        }), this.records.push(Z);
    }
    toJSON() {
        return {
            keys: this.keys,
            records: this.records
        };
    }
}

function _T2(I, G, {
    getFn: Z = h4.getFn,
    fieldNormWeight: d = h4.fieldNormWeight
} = {}) {
    let W = new $21({
        getFn: Z,
        fieldNormWeight: d
    });
    return W.setKeys(I.map(AT2)), W.setSources(G), W.create(), W;
}

function gP3(I, {
    getFn: G = h4.getFn,
    fieldNormWeight: Z = h4.fieldNormWeight
} = {}) {
    let {
        keys: d,
        records: W
    } = I, B = new $21({
        getFn: G,
        fieldNormWeight: Z
    });
    return B.setKeys(d), B.setIndexRecords(W), B;
}

function E21(I, {
    errors: G = 0,
    currentLocation: Z = 0,
    expectedLocation: d = 0,
    distance: W = h4.distance,
    ignoreLocation: B = h4.ignoreLocation
} = {}) {
    let w = G / I.length;
    if (B) return w;
    let V = Math.abs(d - Z);
    if (!W) return V ? 1 : w;
    return w + V / W;
}

function UP3(I = [], G = h4.minMatchCharLength) {
    let Z = [], d = -1, W = -1, B = 0;
    for (let w = I.length; B < w; B += 1) {
        let V = I[B];
        if (V && d === -1) d = B; else if (!V && d !== -1) {
            if (W = B - 1, W - d + 1 >= G) Z.push([ d, W ]);
            d = -1;
        }
    }
    if (I[B - 1] && B - d >= G) Z.push([ d, B - 1 ]);
    return Z;
}

var jN = 32;

function fP3(I, G, Z, {
    location: d = h4.location,
    distance: W = h4.distance,
    threshold: B = h4.threshold,
    findAllMatches: w = h4.findAllMatches,
    minMatchCharLength: V = h4.minMatchCharLength,
    includeMatches: C = h4.includeMatches,
    ignoreLocation: X = h4.ignoreLocation
} = {}) {
    if (G.length > jN) throw new Error(_P3(jN));
    let Y = G.length, A = I.length, D = Math.max(0, Math.min(d, A)), J = B, K = D, z = V > 1 || C, Q = z ? Array(A) : [], U;
    while ((U = I.indexOf(G, K)) > -1) {
        let j = E21(G, {
            currentLocation: U,
            expectedLocation: D,
            distance: W,
            ignoreLocation: X
        });
        if (J = Math.min(j, J), K = U + Y, z) {
            let V1 = 0;
            while (V1 < Y) Q[U + V1] = 1, V1 += 1;
        }
    }
    K = -1;
    let M = [], S = 1, L = Y + A, P = 1 << Y - 1;
    for (let j = 0; j < Y; j += 1) {
        let V1 = 0, k = L;
        while (V1 < k) {
            if (E21(G, {
                errors: j,
                currentLocation: D + k,
                expectedLocation: D,
                distance: W,
                ignoreLocation: X
            }) <= J) V1 = k; else L = k;
            k = Math.floor((L - V1) / 2 + V1);
        }
        L = k;
        let j1 = Math.max(1, D - k + 1), H1 = w ? A : Math.min(D + k, A) + Y, $1 = Array(H1 + 2);
        $1[H1 + 1] = (1 << j) - 1;
        for (let u = H1; u >= j1; u -= 1) {
            let I1 = u - 1, m1 = Z[I.charAt(I1)];
            if (z) Q[I1] = +!!m1;
            if ($1[u] = ($1[u + 1] << 1 | 1) & m1, j) $1[u] |= (M[u + 1] | M[u]) << 1 | 1 | M[u + 1];
            if ($1[u] & P) {
                if (S = E21(G, {
                    errors: j,
                    currentLocation: I1,
                    expectedLocation: D,
                    distance: W,
                    ignoreLocation: X
                }), S <= J) {
                    if (J = S, K = I1, K <= D) break;
                    j1 = Math.max(1, 2 * D - K);
                }
            }
        }
        if (E21(G, {
            errors: j + 1,
            currentLocation: D,
            expectedLocation: D,
            distance: W,
            ignoreLocation: X
        }) > J) break;
        M = $1;
    }
    let m = {
        isMatch: K >= 0,
        score: Math.max(.001, S)
    };
    if (z) {
        let j = UP3(Q, V);
        if (!j.length) m.isMatch = !1; else if (C) m.indices = j;
    }
    return m;
}

function RP3(I) {
    let G = {};
    for (let Z = 0, d = I.length; Z < d; Z += 1) {
        let W = I.charAt(Z);
        G[W] = (G[W] || 0) | 1 << d - Z - 1;
    }
    return G;
}

class bv1 {
    constructor(I, {
        location: G = h4.location,
        threshold: Z = h4.threshold,
        distance: d = h4.distance,
        includeMatches: W = h4.includeMatches,
        findAllMatches: B = h4.findAllMatches,
        minMatchCharLength: w = h4.minMatchCharLength,
        isCaseSensitive: V = h4.isCaseSensitive,
        ignoreLocation: C = h4.ignoreLocation
    } = {}) {
        if (this.options = {
            location: G,
            threshold: Z,
            distance: d,
            includeMatches: W,
            findAllMatches: B,
            minMatchCharLength: w,
            isCaseSensitive: V,
            ignoreLocation: C
        }, this.pattern = V ? I : I.toLowerCase(), this.chunks = [], !this.pattern.length) return;
        let X = (A, D) => {
            this.chunks.push({
                pattern: A,
                alphabet: RP3(A),
                startIndex: D
            });
        }, Y = this.pattern.length;
        if (Y > jN) {
            let A = 0, D = Y % jN, J = Y - D;
            while (A < J) X(this.pattern.substr(A, jN), A), A += jN;
            if (D) {
                let K = Y - jN;
                X(this.pattern.substr(K), K);
            }
        } else X(this.pattern, 0);
    }
    searchIn(I) {
        let {
            isCaseSensitive: G,
            includeMatches: Z
        } = this.options;
        if (!G) I = I.toLowerCase();
        if (this.pattern === I) {
            let J = {
                isMatch: !0,
                score: 0
            };
            if (Z) J.indices = [ [ 0, I.length - 1 ] ];
            return J;
        }
        let {
            location: d,
            distance: W,
            threshold: B,
            findAllMatches: w,
            minMatchCharLength: V,
            ignoreLocation: C
        } = this.options, X = [], Y = 0, A = !1;
        this.chunks.forEach(({
            pattern: J,
            alphabet: K,
            startIndex: z
        }) => {
            let {
                isMatch: Q,
                score: U,
                indices: M
            } = fP3(I, J, K, {
                location: d + z,
                distance: W,
                threshold: B,
                findAllMatches: w,
                minMatchCharLength: V,
                includeMatches: Z,
                ignoreLocation: C
            });
            if (Q) A = !0;
            if (Y += U, Q && M) X = [ ...X, ...M ];
        });
        let D = {
            isMatch: A,
            score: A ? Y / this.chunks.length : 1
        };
        if (A && Z) D.indices = X;
        return D;
    }
}

class F_ {
    constructor(I) {
        this.pattern = I;
    }
    static isMultiMatch(I) {
        return WT2(I, this.multiRegex);
    }
    static isSingleMatch(I) {
        return WT2(I, this.singleRegex);
    }
    search() {}
}

function WT2(I, G) {
    let Z = I.match(G);
    return Z ? Z[1] : null;
}

class HT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "exact";
    }
    static get multiRegex() {
        return /^="(.*)"$/;
    }
    static get singleRegex() {
        return /^=(.*)$/;
    }
    search(I) {
        let G = I === this.pattern;
        return {
            isMatch: G,
            score: G ? 0 : 1,
            indices: [ 0, this.pattern.length - 1 ]
        };
    }
}

class DT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "inverse-exact";
    }
    static get multiRegex() {
        return /^!"(.*)"$/;
    }
    static get singleRegex() {
        return /^!(.*)$/;
    }
    search(I) {
        let Z = I.indexOf(this.pattern) === -1;
        return {
            isMatch: Z,
            score: Z ? 0 : 1,
            indices: [ 0, I.length - 1 ]
        };
    }
}

class FT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "prefix-exact";
    }
    static get multiRegex() {
        return /^\^"(.*)"$/;
    }
    static get singleRegex() {
        return /^\^(.*)$/;
    }
    search(I) {
        let G = I.startsWith(this.pattern);
        return {
            isMatch: G,
            score: G ? 0 : 1,
            indices: [ 0, this.pattern.length - 1 ]
        };
    }
}

class JT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "inverse-prefix-exact";
    }
    static get multiRegex() {
        return /^!\^"(.*)"$/;
    }
    static get singleRegex() {
        return /^!\^(.*)$/;
    }
    search(I) {
        let G = !I.startsWith(this.pattern);
        return {
            isMatch: G,
            score: G ? 0 : 1,
            indices: [ 0, I.length - 1 ]
        };
    }
}

class KT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "suffix-exact";
    }
    static get multiRegex() {
        return /^"(.*)"\$$/;
    }
    static get singleRegex() {
        return /^(.*)\$$/;
    }
    search(I) {
        let G = I.endsWith(this.pattern);
        return {
            isMatch: G,
            score: G ? 0 : 1,
            indices: [ I.length - this.pattern.length, I.length - 1 ]
        };
    }
}

class zT2 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "inverse-suffix-exact";
    }
    static get multiRegex() {
        return /^!"(.*)"\$$/;
    }
    static get singleRegex() {
        return /^!(.*)\$$/;
    }
    search(I) {
        let G = !I.endsWith(this.pattern);
        return {
            isMatch: G,
            score: G ? 0 : 1,
            indices: [ 0, I.length - 1 ]
        };
    }
}

class jv1 extends F_ {
    constructor(I, {
        location: G = h4.location,
        threshold: Z = h4.threshold,
        distance: d = h4.distance,
        includeMatches: W = h4.includeMatches,
        findAllMatches: B = h4.findAllMatches,
        minMatchCharLength: w = h4.minMatchCharLength,
        isCaseSensitive: V = h4.isCaseSensitive,
        ignoreLocation: C = h4.ignoreLocation
    } = {}) {
        super(I);
        this._bitapSearch = new bv1(I, {
            location: G,
            threshold: Z,
            distance: d,
            includeMatches: W,
            findAllMatches: B,
            minMatchCharLength: w,
            isCaseSensitive: V,
            ignoreLocation: C
        });
    }
    static get type() {
        return "fuzzy";
    }
    static get multiRegex() {
        return /^"(.*)"$/;
    }
    static get singleRegex() {
        return /^(.*)$/;
    }
    search(I) {
        return this._bitapSearch.searchIn(I);
    }
}

class lv1 extends F_ {
    constructor(I) {
        super(I);
    }
    static get type() {
        return "include";
    }
    static get multiRegex() {
        return /^'"(.*)"$/;
    }
    static get singleRegex() {
        return /^'(.*)$/;
    }
    search(I) {
        let G = 0, Z, d = [], W = this.pattern.length;
        while ((Z = I.indexOf(this.pattern, G)) > -1) G = Z + W, d.push([ Z, G - 1 ]);
        let B = !!d.length;
        return {
            isMatch: B,
            score: B ? 0 : 1,
            indices: d
        };
    }
}

var uv1 = [ HT2, lv1, FT2, JT2, zT2, KT2, DT2, jv1 ], BT2 = uv1.length, vP3 = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/, EP3 = "|";

function MP3(I, G = {}) {
    return I.split(EP3).map(Z => {
        let d = Z.trim().split(vP3).filter(B => B && !!B.trim()), W = [];
        for (let B = 0, w = d.length; B < w; B += 1) {
            let V = d[B], C = !1, X = -1;
            while (!C && ++X < BT2) {
                let Y = uv1[X], A = Y.isMultiMatch(V);
                if (A) W.push(new Y(A, G)), C = !0;
            }
            if (C) continue;
            X = -1;
            while (++X < BT2) {
                let Y = uv1[X], A = Y.isSingleMatch(V);
                if (A) {
                    W.push(new Y(A, G));
                    break;
                }
            }
        }
        return W;
    });
}

var $P3 = new Set([ jv1.type, lv1.type ]);

class QT2 {
    constructor(I, {
        isCaseSensitive: G = h4.isCaseSensitive,
        includeMatches: Z = h4.includeMatches,
        minMatchCharLength: d = h4.minMatchCharLength,
        ignoreLocation: W = h4.ignoreLocation,
        findAllMatches: B = h4.findAllMatches,
        location: w = h4.location,
        threshold: V = h4.threshold,
        distance: C = h4.distance
    } = {}) {
        this.query = null, this.options = {
            isCaseSensitive: G,
            includeMatches: Z,
            minMatchCharLength: d,
            findAllMatches: B,
            ignoreLocation: W,
            location: w,
            threshold: V,
            distance: C
        }, this.pattern = G ? I : I.toLowerCase(), this.query = MP3(this.pattern, this.options);
    }
    static condition(I, G) {
        return G.useExtendedSearch;
    }
    searchIn(I) {
        let G = this.query;
        if (!G) return {
            isMatch: !1,
            score: 1
        };
        let {
            includeMatches: Z,
            isCaseSensitive: d
        } = this.options;
        I = d ? I : I.toLowerCase();
        let W = 0, B = [], w = 0;
        for (let V = 0, C = G.length; V < C; V += 1) {
            let X = G[V];
            B.length = 0, W = 0;
            for (let Y = 0, A = X.length; Y < A; Y += 1) {
                let D = X[Y], {
                    isMatch: J,
                    indices: K,
                    score: z
                } = D.search(I);
                if (J) {
                    if (W += 1, w += z, Z) {
                        let Q = D.constructor.type;
                        if ($P3.has(Q)) B = [ ...B, ...K ]; else B.push(K);
                    }
                } else {
                    w = 0, W = 0, B.length = 0;
                    break;
                }
            }
            if (W) {
                let Y = {
                    isMatch: !0,
                    score: w / W
                };
                if (Z) Y.indices = B;
                return Y;
            }
        }
        return {
            isMatch: !1,
            score: 1
        };
    }
}

var yv1 = [];

function SP3(...I) {
    yv1.push(...I);
}

function Ov1(I, G) {
    for (let Z = 0, d = yv1.length; Z < d; Z += 1) {
        let W = yv1[Z];
        if (W.condition(I, G)) return new W(I, G);
    }
    return new bv1(I, G);
}

var M21 = {
    AND: "$and",
    OR: "$or"
}, mv1 = {
    PATH: "$path",
    PATTERN: "$val"
}, Tv1 = I => !!(I[M21.AND] || I[M21.OR]), LP3 = I => !!I[mv1.PATH], PP3 = I => !D_(I) && CT2(I) && !Tv1(I), wT2 = I => ({
    [M21.AND]: Object.keys(I).map(G => ({
        [G]: I[G]
    }))
});

function NT2(I, G, {
    auto: Z = !0
} = {}) {
    let d = W => {
        let B = Object.keys(W), w = LP3(W);
        if (!w && B.length > 1 && !Tv1(W)) return d(wT2(W));
        if (PP3(W)) {
            let C = w ? W[mv1.PATH] : B[0], X = w ? W[mv1.PATTERN] : W[C];
            if (!iX(X)) throw new Error(AP3(C));
            let Y = {
                keyId: Pv1(C),
                pattern: X
            };
            if (Z) Y.searcher = Ov1(X, G);
            return Y;
        }
        let V = {
            children: [],
            operator: B[0]
        };
        return B.forEach(C => {
            let X = W[C];
            if (D_(X)) X.forEach(Y => {
                V.children.push(d(Y));
            });
        }), V;
    };
    if (!Tv1(I)) I = wT2(I);
    return d(I);
}

function uP3(I, {
    ignoreFieldNorm: G = h4.ignoreFieldNorm
}) {
    I.forEach(Z => {
        let d = 1;
        Z.matches.forEach(({
            key: W,
            norm: B,
            score: w
        }) => {
            let V = W ? W.weight : null;
            d *= Math.pow(w === 0 && V ? Number.EPSILON : w, (V || 1) * (G ? 1 : B));
        }), Z.score = d;
    });
}

function yP3(I, G) {
    let Z = I.matches;
    if (G.matches = [], !VW(Z)) return;
    Z.forEach(d => {
        if (!VW(d.indices) || !d.indices.length) return;
        let {
            indices: W,
            value: B
        } = d, w = {
            indices: W,
            value: B
        };
        if (d.key) w.key = d.key.src;
        if (d.idx > -1) w.refIndex = d.idx;
        G.matches.push(w);
    });
}

function OP3(I, G) {
    G.score = I.score;
}

function mP3(I, G, {
    includeMatches: Z = h4.includeMatches,
    includeScore: d = h4.includeScore
} = {}) {
    let W = [];
    if (Z) W.push(yP3);
    if (d) W.push(OP3);
    return I.map(B => {
        let {
            idx: w
        } = B, V = {
            item: G[w],
            refIndex: w
        };
        if (W.length) W.forEach(C => {
            C(B, V);
        });
        return V;
    });
}

class $J {
    constructor(I, G = {}, Z) {
        this.options = {
            ...h4,
            ...G
        }, this.options.useExtendedSearch, this._keyStore = new YT2(this.options.keys), 
        this.setCollection(I, Z);
    }
    setCollection(I, G) {
        if (this._docs = I, G && !(G instanceof $21)) throw new Error(YP3);
        this._myIndex = G || _T2(this.options.keys, this._docs, {
            getFn: this.options.getFn,
            fieldNormWeight: this.options.fieldNormWeight
        });
    }
    add(I) {
        if (!VW(I)) return;
        this._docs.push(I), this._myIndex.add(I);
    }
    remove(I = () => !1) {
        let G = [];
        for (let Z = 0, d = this._docs.length; Z < d; Z += 1) {
            let W = this._docs[Z];
            if (I(W, Z)) this.removeAt(Z), Z -= 1, d -= 1, G.push(W);
        }
        return G;
    }
    removeAt(I) {
        this._docs.splice(I, 1), this._myIndex.removeAt(I);
    }
    getIndex() {
        return this._myIndex;
    }
    search(I, {
        limit: G = -1
    } = {}) {
        let {
            includeMatches: Z,
            includeScore: d,
            shouldSort: W,
            sortFn: B,
            ignoreFieldNorm: w
        } = this.options, V = iX(I) ? iX(this._docs[0]) ? this._searchStringList(I) : this._searchObjectList(I) : this._searchLogical(I);
        if (uP3(V, {
            ignoreFieldNorm: w
        }), W) V.sort(B);
        if (VT2(G) && G > -1) V = V.slice(0, G);
        return mP3(V, this._docs, {
            includeMatches: Z,
            includeScore: d
        });
    }
    _searchStringList(I) {
        let G = Ov1(I, this.options), {
            records: Z
        } = this._myIndex, d = [];
        return Z.forEach(({
            v: W,
            i: B,
            n: w
        }) => {
            if (!VW(W)) return;
            let {
                isMatch: V,
                score: C,
                indices: X
            } = G.searchIn(W);
            if (V) d.push({
                item: W,
                idx: B,
                matches: [ {
                    score: C,
                    value: W,
                    norm: w,
                    indices: X
                } ]
            });
        }), d;
    }
    _searchLogical(I) {
        let G = NT2(I, this.options), Z = (w, V, C) => {
            if (!w.children) {
                let {
                    keyId: Y,
                    searcher: A
                } = w, D = this._findMatches({
                    key: this._keyStore.get(Y),
                    value: this._myIndex.getValueForItemAtKeyId(V, Y),
                    searcher: A
                });
                if (D && D.length) return [ {
                    idx: C,
                    item: V,
                    matches: D
                } ];
                return [];
            }
            let X = [];
            for (let Y = 0, A = w.children.length; Y < A; Y += 1) {
                let D = w.children[Y], J = Z(D, V, C);
                if (J.length) X.push(...J); else if (w.operator === M21.AND) return [];
            }
            return X;
        }, d = this._myIndex.records, W = {}, B = [];
        return d.forEach(({
            $: w,
            i: V
        }) => {
            if (VW(w)) {
                let C = Z(G, w, V);
                if (C.length) {
                    if (!W[V]) W[V] = {
                        idx: V,
                        item: w,
                        matches: []
                    }, B.push(W[V]);
                    C.forEach(({
                        matches: X
                    }) => {
                        W[V].matches.push(...X);
                    });
                }
            }
        }), B;
    }
    _searchObjectList(I) {
        let G = Ov1(I, this.options), {
            keys: Z,
            records: d
        } = this._myIndex, W = [];
        return d.forEach(({
            $: B,
            i: w
        }) => {
            if (!VW(B)) return;
            let V = [];
            if (Z.forEach((C, X) => {
                V.push(...this._findMatches({
                    key: C,
                    value: B[X],
                    searcher: G
                }));
            }), V.length) W.push({
                idx: w,
                item: B,
                matches: V
            });
        }), W;
    }
    _findMatches({
        key: I,
        value: G,
        searcher: Z
    }) {
        if (!VW(G)) return [];
        let d = [];
        if (D_(G)) G.forEach(({
            v: W,
            i: B,
            n: w
        }) => {
            if (!VW(W)) return;
            let {
                isMatch: V,
                score: C,
                indices: X
            } = Z.searchIn(W);
            if (V) d.push({
                score: C,
                key: I,
                value: W,
                idx: B,
                norm: w,
                indices: X
            });
        }); else {
            let {
                v: W,
                n: B
            } = G, {
                isMatch: w,
                score: V,
                indices: C
            } = Z.searchIn(W);
            if (w) d.push({
                score: V,
                key: I,
                value: W,
                norm: B,
                indices: C
            });
        }
        return d;
    }
}

$J.version = "7.0.0";

$J.createIndex = _T2;

$J.parseIndex = gP3;

$J.config = h4;

$J.parseQuery = NT2;

SP3(QT2);

var TP3 = /[:_-]/g;

function qT2({
    commands: I,
    onInputChange: G,
    onSubmit: Z,
    setCursorOffset: d
}) {
    let [ W, B ] = Kb.useState([]), [ w, V ] = Kb.useState(-1);
    function C(Y) {
        if (Y.startsWith("/")) {
            let A = Y.slice(1).toLowerCase();
            if (Y.includes(" ")) {
                B([]), V(-1);
                return;
            }
            if (A.trim() === "") {
                let U = I.filter(M => !M.isHidden).map(M => M.userFacingName());
                B(U), V(0);
                return;
            }
            let J = I.filter(U => !U.isHidden).flatMap(U => {
                let M = U.userFacingName(), S = new Set();
                if (S.add(M.toLowerCase()), M.split(TP3).filter(Boolean).forEach(P => S.add(P.toLowerCase())), 
                U.aliases) U.aliases.forEach(P => S.add(P.toLowerCase()));
                return Array.from(S).map(P => ({
                    searchKey: P,
                    commandName: U.userFacingName()
                }));
            }), z = new $J(J, {
                includeScore: !0,
                threshold: .3,
                location: 0,
                distance: 10,
                keys: [ "searchKey" ]
            }).search(A), Q = Array.from(new Set(z.map(U => U.item.commandName)));
            B(Q), V(0);
        } else B([]), V(-1);
    }
    _4((Y, A) => {
        if (W.length > 0) {
            if (A.downArrow) return V(D => D >= W.length - 1 ? 0 : D + 1), !0; else if (A.upArrow) return V(D => D <= 0 ? W.length - 1 : D - 1), 
            !0; else if (A.tab || A.return && w >= 0) {
                if (w === -1 && A.tab) V(0);
                let D = w >= 0 ? w : 0, J = W[D];
                if (!J) return !0;
                let K = "/" + J + " ";
                if (G(K), d(K.length), B([]), V(-1), A.return) {
                    let z = U01(J, I);
                    if (z.type !== "prompt" || (z.argNames ?? []).length === 0) Z(K, !0);
                }
                return !0;
            }
        }
    });
    let X = Kb.useCallback(() => {
        B([]), V(-1);
    }, []);
    return {
        suggestions: W,
        selectedSuggestion: w,
        updateSuggestions: C,
        clearSuggestions: X
    };
}

var S21 = A1(u1(), 1);

var _M = A1(u1(), 1);

function gT2(I) {
    let [ G, Z ] = _M.useState("INSERT"), d = _M.default.useRef(""), W = _M.default.useRef(null), B = _M.default.useRef(""), {
        onMessage: w
    } = I, V = b11(I), C = (z, Q) => {
        if (z === d.current) return Q.startOfLine();
        switch (z) {
          case "h":
            return Q.left();

          case "l":
            return Q.right();

          case "j":
            return Q.down();

          case "k":
            return Q.up();

          case "0":
            return Q.startOfLine();

          case "^":
            return Q.firstNonBlankInLine();

          case "$":
            return Q.endOfLine();

          case "w":
            return Q.nextWord();

          case "e":
            return Q.endOfWord();

          case "b":
            return Q.prevWord();

          case "gg":
            return Q.startOfFirstLine();

          case "G":
            return Q.startOfLastLine();

          default:
            return null;
        }
    }, X = (z, Q, U) => {
        let M = V.offset, S = z === "change";
        if (Q === d.current) {
            let P = U.startOfLine();
            if (U.text.indexOf(`
`) === -1) {
                if (z !== "move") I.onChange("");
                M = 0;
            } else {
                let {
                    line: m
                } = U.getPosition();
                if (z === "delete") {
                    let j = U.text.split(`
`);
                    j.splice(m, 1);
                    let V1 = j.join(`
`);
                    I.onChange(V1), M = W8.fromText(V1, I.columns, m < j.length ? P.offset : Math.max(0, P.offset - 1)).offset;
                } else if (z === "change") {
                    let j = U.text.split(`
`);
                    j[m] = "", I.onChange(j.join(`
`)), M = P.offset;
                } else M = P.offset;
            }
            return {
                newOffset: M,
                switchToInsert: S
            };
        }
        let L = C(Q, U);
        if (!L || U.equals(L)) return {
            newOffset: M,
            switchToInsert: S
        };
        if (z === "move") M = L.offset; else {
            let [ P, m ] = U.offset <= L.offset ? [ U, L ] : [ L, U ], j = m;
            if (Q === "e" && U.offset <= L.offset) j = m.right();
            let V1 = P.modifyText(j, "");
            if (I.onChange(V1.text), z === "change") M = P.offset; else M = V1.offset;
        }
        return {
            newOffset: M,
            switchToInsert: S
        };
    }, Y = z => {
        if (z !== void 0) V.setOffset(z);
        Z("INSERT"), I.onModeChange?.("INSERT"), w?.(!0, "-- INSERT MODE --"), setTimeout(() => w?.(!1), 1e3);
    }, A = () => {
        Z("NORMAL"), I.onModeChange?.("NORMAL"), w?.(!0, "-- NORMAL MODE --"), setTimeout(() => w?.(!1), 1e3);
    }, D = z => {
        W.current = z;
    }, J = z => {
        let Q = W.current;
        if (!Q) return;
        switch (Q.type) {
          case "delete":
            if (Q.motion) {
                let {
                    newOffset: U
                } = X("delete", Q.motion, z);
                V.setOffset(U);
            }
            break;

          case "change":
            if (Q.motion) {
                let {
                    newOffset: U
                } = X("change", Q.motion, z);
                V.setOffset(U), Y(U);
            }
            break;

          case "insert":
            if (Q.insertedText) {
                let U = z.insert(Q.insertedText);
                I.onChange(U.text), V.setOffset(U.offset);
            }
            break;

          case "x":
            if (!z.equals(z.del())) I.onChange(z.del().text), V.setOffset(z.del().offset);
            break;
        }
    };
    return {
        ...V,
        onInput: (z, Q) => {
            let U = W8.fromText(I.value, I.columns, V.offset);
            if (Q.ctrl) {
                V.onInput(z, Q);
                return;
            }
            if (Q.escape && G === "INSERT") {
                if (B.current) D({
                    type: "insert",
                    insertedText: B.current
                }), B.current = "";
                A();
                return;
            }
            if (G === "NORMAL" && d.current) {
                if (d.current === "d") {
                    let {
                        newOffset: M
                    } = X("delete", z, U);
                    V.setOffset(M), D({
                        type: "delete",
                        motion: z
                    }), d.current = "";
                    return;
                } else if (d.current === "c") {
                    let {
                        newOffset: M
                    } = X("change", z, U);
                    D({
                        type: "change",
                        motion: z
                    }), d.current = "", Y(M);
                    return;
                } else if (d.current === "g" && z === "g") {
                    let {
                        newOffset: M
                    } = X("move", "gg", U);
                    V.setOffset(M), d.current = "";
                    return;
                }
                d.current = "";
            }
            if (G === "NORMAL") switch (z) {
              case ".":
                {
                    J(U);
                    return;
                }

              case "i":
                B.current = "", Y();
                return;

              case "I":
                {
                    B.current = "", Y(U.startOfLine().offset);
                    return;
                }

              case "a":
                {
                    B.current = "", Y(U.right().offset);
                    return;
                }

              case "A":
                {
                    B.current = "", Y(U.endOfLine().offset);
                    return;
                }

              case "h":
              case "l":
              case "j":
              case "k":
              case "0":
              case "^":
              case "$":
              case "w":
              case "e":
              case "b":
              case "G":
                {
                    let {
                        newOffset: M
                    } = X("move", z, U);
                    V.setOffset(M);
                    return;
                }

              case "g":
                {
                    d.current = "g";
                    return;
                }

              case "x":
                {
                    if (!U.equals(U.del())) I.onChange(U.del().text), V.setOffset(U.del().offset), 
                    D({
                        type: "x"
                    });
                    return;
                }

              case "d":
                d.current = "d";
                return;

              case "D":
                {
                    let M = X("delete", "$", U);
                    V.setOffset(M.newOffset), D({
                        type: "delete",
                        motion: "$"
                    });
                    return;
                }

              case "c":
                d.current = "c";
                return;

              case "C":
                {
                    let M = X("change", "$", U);
                    V.setOffset(M.newOffset), D({
                        type: "change",
                        motion: "$"
                    }), Y();
                    return;
                }
            }
            if (G === "INSERT") {
                if (Q.backspace || Q.delete) {
                    if (B.current.length > 0) B.current = B.current.slice(0, -1);
                } else B.current += z;
                V.onInput(z, Q);
            }
        },
        mode: G,
        setMode: Z
    };
}

function kv1(I) {
    let G = g8().text, Z = gT2({
        value: I.value,
        onChange: I.onChange,
        onSubmit: I.onSubmit,
        onExit: I.onExit,
        onExitMessage: I.onExitMessage,
        onMessage: I.onMessage,
        onHistoryReset: I.onHistoryReset,
        onHistoryUp: I.onHistoryUp,
        onHistoryDown: I.onHistoryDown,
        focus: I.focus,
        mask: I.mask,
        multiline: I.multiline,
        cursorChar: I.showCursor ? " " : "",
        highlightPastedText: I.highlightPastedText,
        invert: T0.inverse,
        themeText: B => T0.ansi256(G)(B),
        columns: I.columns,
        onImagePaste: I.onImagePaste,
        disableCursorMovementForUpDownKeys: I.disableCursorMovementForUpDownKeys,
        externalOffset: I.cursorOffset,
        onOffsetChange: I.onChangeCursorOffset,
        onModeChange: I.onModeChange
    }), {
        mode: d,
        setMode: W
    } = Z;
    return S21.default.useEffect(() => {
        if (I.initialMode && I.initialMode !== d) W(I.initialMode);
    }, [ I.initialMode, d, W ]), S21.default.createElement(p, {
        flexDirection: "column"
    }, S21.default.createElement(j11, {
        inputState: Z,
        ...I
    }));
}

function L21() {
    return !1;
}

var b7 = A1(u1(), 1);

var F4 = A1(u1(), 1), MT2 = A1(u1(), 1);

var UT2 = A1(u1(), 1);

class xv1 extends UT2.Component {
    constructor(I) {
        super(I);
        this.state = {
            hasError: !1
        };
    }
    static getDerivedStateFromError() {
        return {
            hasError: !0
        };
    }
    componentDidCatch(I) {
        Xx(I);
    }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

var I5 = A1(u1(), 1);

var fT2 = A1(VP(), 1), P21 = A1(u1(), 1);

function RT2({
    debug: I,
    isUpdating: G,
    onChangeIsUpdating: Z,
    onAutoUpdaterResult: d,
    autoUpdaterResult: W
}) {
    let B = e1(), [ w, V ] = P21.useState({}), C = I5.useCallback(async () => {
        if (G) return;
        let X = {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "0.2.35"
        }.VERSION, Y = await r11(), A = va1();
        if (V({
            global: X,
            latest: Y
        }), !A && X && Y && !fT2.gte(X, Y)) {
            let D = Date.now();
            Z(!0);
            let J = await s11();
            if (Z(!1), J === "success") B0("tengu_auto_updater_success", {
                fromVersion: X,
                toVersion: Y,
                durationMs: String(Date.now() - D)
            }); else B0("tengu_auto_updater_fail", {
                fromVersion: X,
                attemptedVersion: Y,
                status: J,
                durationMs: String(Date.now() - D)
            });
            d({
                version: Y,
                status: J
            });
        }
    }, [ d ]);
    if (P21.useEffect(() => {
        C();
    }, [ C ]), L01(C, 18e5), I) return I5.createElement(p, {
        flexDirection: "row"
    }, I5.createElement(O, {
        dimColor: !0
    }, "globalVersion: ", w.global, " · latestVersion:", " ", w.latest));
    if (!W?.version && (!w.global || !w.latest)) return null;
    if (!W?.version && !G) return null;
    return I5.createElement(p, {
        flexDirection: "row",
        gap: 1
    }, I && I5.createElement(O, {
        dimColor: !0
    }, "globalVersion: ", w.global, " · latestVersion:", " ", w.latest), G && I5.createElement(I5.Fragment, null, I5.createElement(p, null, I5.createElement(O, {
        color: B.secondaryText,
        dimColor: !0,
        wrap: "end"
    }, "Auto-updating to v", w.latest, "…"))), W?.status === "success" && W?.version ? I5.createElement(O, {
        color: B.success
    }, "✓ Update installed · Restart to apply") : null, (W?.status === "install_failed" || W?.status === "no_permissions") && I5.createElement(O, {
        color: B.error
    }, "✗ Auto-update failed · Try ", I5.createElement(O, {
        bold: !0
    }, "claude doctor"), " or", " ", I5.createElement(O, {
        bold: !0
    }, "npm i -g ", {
        ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
        PACKAGE_URL: "@anthropic-ai/claude-code",
        README_URL: "https://docs.anthropic.com/s/claude-code",
        VERSION: "0.2.35"
    }.PACKAGE_URL)));
}

var zb = A1(u1(), 1);

var hv1 = 19e4, cv1 = hv1 * .6, bP3 = hv1 * .8;

function vT2({
    tokenUsage: I
}) {
    let G = e1();
    if (I < cv1) return null;
    let Z = I >= bP3;
    return zb.createElement(p, {
        flexDirection: "row"
    }, zb.createElement(O, {
        color: Z ? G.error : G.warning
    }, "Context low (", Math.max(0, 100 - Math.round(I / hv1 * 100)), "% remaining) · Run /compact to compact & continue"));
}

function ET2({
    autoUpdaterResult: I,
    isAutoUpdating: G,
    debug: Z,
    messages: d,
    tokenUsage: W,
    permissionMode: B,
    onAutoUpdaterResult: w,
    onChangeIsUpdating: V
}) {
    let C = !!I || !!G, X = W >= cv1, Y = P$2(B);
    return F4.createElement(xv1, null, F4.createElement(p, {
        justifyContent: "flex-end",
        gap: 1
    }, !C && !Y && !Z && !X && F4.createElement(O, {
        dimColor: !0
    }, tU.isEnabled && A20() ? "shift + ⏎ for newline" : _20() ? "\\⏎ for newline" : "Backslash (\\) + Return (⏎) for newline"), Y && F4.createElement(O, {
        color: e1().warning
    }, Y), !Y && Z && F4.createElement(O, {
        dimColor: !0
    }, `${xA(d)} tokens (${Math.round(1e4 * (eD2(d) || 1) / (xA(d) || 1)) / 100}% cached)`), F4.createElement(vT2, {
        tokenUsage: W
    }), F4.createElement(RT2, {
        debug: Z,
        onAutoUpdaterResult: w,
        autoUpdaterResult: I,
        isUpdating: G,
        onChangeIsUpdating: V
    })));
}

function jP3({
    exitMessage: I,
    message: G,
    vimMode: Z,
    mode: d,
    autoUpdaterResult: W,
    isAutoUpdating: B,
    debug: w,
    messages: V,
    tokenUsage: C,
    onAutoUpdaterResult: X,
    onChangeIsUpdating: Y,
    suggestions: A,
    selectedSuggestion: D,
    commands: J,
    permissionMode: K,
    writeFileAllowedDirectories: z
}) {
    let {
        columns: Q
    } = Q5(), U = e1();
    if (A.length === 0) return F4.createElement(p, {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingX: 2,
        paddingY: 0
    }, F4.createElement(p, {
        justifyContent: "flex-start",
        gap: 1
    }, vB(lP3({
        exitMessage: I,
        message: G,
        mode: d,
        writeFileAllowedDirectories: z,
        vimMode: Z
    }), S => F4.createElement(O, {
        dimColor: !0,
        key: `dot-${S}`
    }, "·"))), F4.createElement(ET2, {
        autoUpdaterResult: W,
        isAutoUpdating: B,
        debug: w,
        messages: V,
        tokenUsage: C,
        permissionMode: K,
        onAutoUpdaterResult: X,
        onChangeIsUpdating: Y
    }));
    return F4.createElement(p, {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingX: 2,
        paddingY: 0
    }, F4.createElement(p, {
        flexDirection: "column"
    }, A.map((S, L) => {
        let P = J.find(m => m.userFacingName() === S.replace("/", ""));
        return F4.createElement(p, {
            key: S,
            flexDirection: Q < 80 ? "column" : "row"
        }, F4.createElement(p, {
            width: Q < 80 ? void 0 : M()
        }, F4.createElement(O, {
            color: L === D ? U.suggestion : void 0,
            dimColor: L !== D
        }, "/", S, P?.aliases && P.aliases.length > 0 && F4.createElement(O, {
            dimColor: !0
        }, " (", P.aliases.join(", "), ")"))), P && F4.createElement(p, {
            width: Q - (Q < 80 ? 4 : M() + 4),
            paddingLeft: Q < 80 ? 4 : 0
        }, F4.createElement(O, {
            color: L === D ? U.suggestion : void 0,
            dimColor: L !== D,
            wrap: "wrap"
        }, F4.createElement(O, {
            dimColor: L !== D
        }, P.description, P.type === "prompt" && P.argNames?.length ? ` (arguments: ${P.argNames.join(", ")})` : null))));
    })), F4.createElement(ET2, {
        autoUpdaterResult: W,
        isAutoUpdating: B,
        debug: w,
        messages: V,
        tokenUsage: xA(V),
        permissionMode: K,
        onAutoUpdaterResult: X,
        onChangeIsUpdating: Y
    }));
    function M() {
        return Math.max(...J.map(S => S.userFacingName().length)) + 5;
    }
}

function lP3({
    exitMessage: I,
    message: G,
    mode: Z,
    writeFileAllowedDirectories: d,
    vimMode: W
}) {
    if (I.show) return [ F4.createElement(O, {
        dimColor: !0,
        key: "exit-message"
    }, "Press ", I.key, " again to exit") ];
    let B = e1();
    if (G.show) return [ F4.createElement(O, {
        color: G.color && G.color in B ? B[G.color] : void 0,
        dimColor: !G.color,
        key: "message"
    }, G.text) ];
    return [ ...L21() && W === "INSERT" ? [ F4.createElement(O, {
        dimColor: !0,
        key: "vim-insert"
    }, "-- INSERT --") ] : [], ...[], F4.createElement(O, {
        color: Z === "bash" ? B.bashBorder : void 0,
        dimColor: Z !== "bash",
        key: "bash-mode"
    }, "! for bash mode"), F4.createElement(O, {
        dimColor: !0,
        key: "/ for commands"
    }, "/ for commands") ];
}

var $T2 = MT2.memo(jP3);

function ST2(I) {
    return `[Pasted text +${(I.match(/\r\n|\r|\n/g) || []).length} lines] `;
}

function kP3({
    allowedToolsFromCLIFlag: I,
    commands: G,
    forkNumber: Z,
    messageLogName: d,
    isDisabled: W,
    isLoading: B,
    onQuery: w,
    debug: V,
    verbose: C,
    messages: X,
    setToolJSX: Y,
    onAutoUpdaterResult: A,
    autoUpdaterResult: D,
    tools: J,
    input: K,
    onInputChange: z,
    mode: Q,
    onModeChange: U,
    submitCount: M,
    onSubmitCountChange: S,
    setIsLoading: L,
    setAbortController: P,
    onShowMessageSelector: m,
    setForkConvoWithMessagesOnTheNextRender: j,
    setMessages: V1,
    readFileTimestamps: k,
    permissionMode: j1,
    writeFileAllowedDirectories: H1,
    setWriteFileAllowedDirectories: $1
}) {
    let [ F1, u ] = b7.useState(!1), [ I1, m1 ] = b7.useState({
        show: !1
    }), [ l1, a1 ] = b7.useState(0), [ N0, f0 ] = b7.useState({
        show: !1
    }), [ G2, J0 ] = b7.useState(null), [ G1, f1 ] = b7.useState(""), [ Q1, h1 ] = b7.useState(K.length), [ s1, V0 ] = b7.useState(null), [ i, o ] = b7.useState("INSERT");
    b7.useEffect(() => {
        v21().then(K0 => {
            f1(`Try "${cK(K0)}"`);
        });
    }, []);
    let {
        suggestions: d1,
        selectedSuggestion: v1,
        updateSuggestions: R1,
        clearSuggestions: q1
    } = qT2({
        commands: G,
        onInputChange: z,
        onSubmit: Y0,
        setCursorOffset: h1
    });
    _4((K0, w2) => {
        if (K0 !== "" || !w2.tab) return;
        $1(c4 => {
            if (c4.has(r8())) c4.delete(r8()); else c4.add(r8());
            return new Set(c4);
        });
    });
    let n1 = b7.useCallback(K0 => {
        if (K0.startsWith("!")) {
            U("bash");
            return;
        }
        R1(K0), z(K0);
    }, [ U, z, R1 ]), {
        resetHistory: g1,
        onHistoryUp: L1,
        onHistoryDown: k1
    } = GT2((K0, w2) => {
        n1(K0), U(w2);
    }, K), n = () => {
        if (d1.length <= 1) L1();
    }, D1 = () => {
        if (d1.length <= 1) k1();
    };
    async function Y0(K0, w2 = !1) {
        if (K0 === "") return;
        if (W) return;
        if (B) return;
        if (d1.length > 0 && !w2) return;
        if ([ "exit", "quit", ":q", ":q!", ":wq", ":wq!" ].includes(K0.trim())) xP3();
        let c4 = K0;
        if (s1) {
            let k0 = ST2(s1);
            if (c4.includes(k0)) c4 = c4.replace(k0, s1);
        }
        z(""), U("prompt"), q1(), J0(null), V0(null), S(k0 => k0 + 1), L(!0);
        let m0 = new AbortController();
        P(m0);
        let C2 = await U8(), W2 = await R01(c4, Q, Y, {
            options: {
                commands: G,
                allowedToolsFromCLIFlag: I,
                forkNumber: Z,
                messageLogName: d,
                tools: J,
                verbose: C,
                slowAndCapableModel: C2,
                maxThinkingTokens: 0
            },
            messages: X,
            abortController: m0,
            readFileTimestamps: k,
            setForkConvoWithMessagesOnTheNextRender: j,
            setMessages: V1,
            addNotification: (k0, c0 = {}) => {
                let {
                    timeoutMs: i2 = 8e3,
                    color: P4
                } = c0;
                a1(L5 => {
                    let j3 = L5 + 1;
                    return f0({
                        show: !0,
                        text: k0,
                        color: P4
                    }), setTimeout(() => {
                        a1(n6 => {
                            if (j3 === n6) f0({
                                show: !1
                            });
                            return n6;
                        });
                    }, i2), j3;
                });
            }
        }, G2 ?? null, H1);
        if (W2.length) w(W2, m0); else {
            MJ(K0), g1();
            return;
        }
        for (let k0 of W2) if (k0.type === "user") {
            let c0 = Q === "bash" ? `!${K0}` : Q === "memory" ? `#${K0}` : K0;
            MJ(c0), g1();
        }
    }
    function r1(K0) {
        U("prompt"), J0(K0);
    }
    function z0(K0) {
        let w2 = K0.replace(/\r/g, `
`), c4 = ST2(w2), m0 = K.slice(0, Q1) + c4 + K.slice(Q1);
        z(m0), h1(Q1 + c4.length), V0(w2);
    }
    _4((K0, w2) => {
        if (K === "" && (w2.escape || w2.backspace || w2.delete)) U("prompt");
        if (w2.escape && X.length > 0 && !K && !B) m();
    });
    let s0 = Q5().columns - 6, C0 = b7.useMemo(() => xA(X), [ X ]), j0 = e1();
    return X8.createElement(p, {
        flexDirection: "column"
    }, X8.createElement(p, {
        alignItems: "flex-start",
        justifyContent: "flex-start",
        borderColor: Q === "bash" ? j0.bashBorder : Q === "memory" ? j0.remember : j0.secondaryBorder,
        borderDimColor: Q !== "memory",
        borderStyle: "round",
        marginTop: 1,
        width: "100%"
    }, X8.createElement(p, {
        alignItems: "flex-start",
        alignSelf: "flex-start",
        flexWrap: "nowrap",
        justifyContent: "flex-start",
        width: 3
    }, Q === "bash" ? X8.createElement(O, {
        color: j0.bashBorder
    }, " ! ") : Q === "memory" ? X8.createElement(O, {
        color: j0.remember
    }, " # ") : X8.createElement(O, {
        color: B ? j0.secondaryText : void 0
    }, " > ")), X8.createElement(p, {
        paddingRight: 1
    }, (() => {
        let K0 = {
            multiline: !0,
            onSubmit: Y0,
            onChange: n1,
            value: K,
            onHistoryUp: n,
            onHistoryDown: D1,
            onHistoryReset: () => g1(),
            placeholder: M > 0 ? void 0 : G1,
            onExit: () => process.exit(0),
            onExitMessage: (w2, c4) => m1({
                show: w2,
                key: c4
            }),
            onMessage: (w2, c4) => f0({
                show: w2,
                text: c4
            }),
            onImagePaste: r1,
            columns: s0,
            isDimmed: W || B,
            disableCursorMovementForUpDownKeys: d1.length > 0,
            cursorOffset: Q1,
            onChangeCursorOffset: h1,
            onPaste: z0,
            focus: !0,
            showCursor: !0
        };
        return L21() ? X8.createElement(kv1, {
            ...K0,
            initialMode: i,
            onModeChange: o
        }) : X8.createElement(MB, {
            ...K0
        });
    })())), X8.createElement($T2, {
        exitMessage: I1,
        message: N0,
        vimMode: i,
        mode: Q,
        autoUpdaterResult: D,
        isAutoUpdating: F1,
        debug: V,
        messages: X,
        tokenUsage: C0,
        onAutoUpdaterResult: A,
        onChangeIsUpdating: u,
        suggestions: d1,
        selectedSuggestion: v1,
        commands: G,
        permissionMode: j1 || "default",
        writeFileAllowedDirectories: H1
    }));
}

var LT2 = b7.memo(kP3);

function xP3() {
    TU1(""), process.exit(0);
}

var PT2 = A1(u1(), 1);

function uT2() {
    PT2.useEffect(() => {
        let I = Math.round(process.uptime() * 1e3);
        B0("tengu_timer", {
            event: "startup",
            durationMs: String(I)
        });
    }, []);
}

var Qb = A1(u1(), 1);

function yT2() {
    let [ I, G ] = Qb.useState(() => {
        return Lw() ? "loading" : "missing";
    }), [ Z, d ] = Qb.useState(null), W = Qb.useCallback(async () => {
        let B = Lw();
        if (!B) {
            G("missing");
            return;
        }
        try {
            let V = await _$2(B) ? "valid" : "invalid";
            G(V);
            return;
        } catch (w) {
            d(w), G("error");
            return;
        }
    }, []);
    return {
        status: I,
        reverify: W,
        error: Z
    };
}

function OT2(I, G, Z, d, W, B, w) {
    _4((V, C) => {
        if (!C.escape) return;
        if (w?.aborted) return;
        if (!w) return;
        if (!W) return;
        if (B) return;
        B0("tengu_cancel", {}), I(null), G(null), Z(null), d();
    });
}

var mT2 = A1(u1(), 1);

function hP3(I) {
    return mT2.useCallback(async (G, Z, d, W, B) => {
        return new Promise(w => {
            function V() {
                B0("tengu_tool_use_cancelled", {
                    messageID: W.message.id,
                    toolName: G.name
                });
            }
            function C() {
                w({
                    result: !1,
                    message: mT
                }), d.abortController.abort();
            }
            if (d.abortController.signal.aborted) {
                V(), C();
                return;
            }
            return EJ(G, Z, d, W, B).then(async X => {
                if (X.result) {
                    B0("tengu_tool_use_granted_in_config", {
                        messageID: W.message.id,
                        toolName: G.name
                    }), w({
                        result: !0
                    });
                    return;
                }
                let [ Y, A ] = await Promise.all([ G.description(Z, {
                    permissionMode: d.options.permissionMode ?? "default"
                }), G === j4 ? At(wT.parse(Z).command, d.abortController.signal) : Promise.resolve(null) ]);
                if (d.abortController.signal.aborted) {
                    V(), C();
                    return;
                }
                I({
                    assistantMessage: W,
                    tool: G,
                    description: Y,
                    input: Z,
                    commandPrefix: A,
                    riskScore: null,
                    onAbort() {
                        V(), B0("tengu_tool_use_rejected_in_prompt", {
                            messageID: W.message.id,
                            toolName: G.name
                        }), C();
                    },
                    onAllow(D) {
                        if (D === "permanent") B0("tengu_tool_use_granted_in_prompt_permanent", {
                            messageID: W.message.id,
                            toolName: G.name
                        }); else B0("tengu_tool_use_granted_in_prompt_temporary", {
                            messageID: W.message.id,
                            toolName: G.name
                        });
                        w({
                            result: !0
                        });
                    },
                    onReject() {
                        B0("tengu_tool_use_rejected_in_prompt", {
                            messageID: W.message.id,
                            toolName: G.name
                        }), C();
                    }
                });
            }).catch(X => {
                if (X instanceof NC) V(), C(); else W0(X);
            });
        });
    }, [ I ]);
}

var TT2 = hP3;

var bT2 = A1(u1(), 1);

function jT2(I, G, Z) {
    bT2.useEffect(() => {
        Mg(JC(G, Z, 0), $g(I));
    }, [ I, G, Z ]);
}

var kT2 = A1(u1(), 1);

var lT2 = A1(u1(), 1);

var cP3 = A1(u1(), 1);

async function Nb(I) {
    let G = UY(I);
    if (G?.type !== "user" || typeof G.message.content !== "string") return B0("tengu_thinking", {
        method: "scratchpad",
        tokenCount: "0",
        messageId: iE(I),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    }), 0;
    let Z = G.message.content.toLowerCase();
    if (Z.includes("think harder") || Z.includes("think intensely") || Z.includes("think longer") || Z.includes("think really hard") || Z.includes("think super hard") || Z.includes("think very hard") || Z.includes("ultrathink")) return B0("tengu_thinking", {
        method: "scratchpad",
        tokenCount: "31999",
        messageId: iE(I),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    }), 31999;
    if (Z.includes("think about it") || Z.includes("think a lot") || Z.includes("think hard") || Z.includes("think more") || Z.includes("megathink")) return B0("tengu_thinking", {
        method: "scratchpad",
        tokenCount: "10000",
        messageId: iE(I),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    }), 1e4;
    if (Z.includes("think")) return B0("tengu_thinking", {
        method: "scratchpad",
        tokenCount: "4000",
        messageId: iE(I),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    }), 4e3;
    return B0("tengu_thinking", {
        method: "scratchpad",
        tokenCount: "0",
        messageId: iE(I),
        provider: M6 ? "bedrock" : $6 ? "vertex" : "1p"
    }), 0;
}

function Vf1({
    commands: I,
    permissionMode: G,
    debug: Z = !1,
    initialForkNumber: d = 0,
    initialPrompt: W,
    messageLogName: B,
    shouldShowPromptInput: w,
    tools: V,
    verbose: C,
    initialMessages: X,
    mcpClients: Y = [],
    isDefaultModel: A = !0,
    allowedToolsFromCLIFlag: D
}) {
    let J = C ?? Q2().verbose, [ K, z ] = z3.useState(k51(B, d, 0)), [ Q, U ] = z3.useState(null), [ M, S ] = z3.useState(null), [ L, P ] = z3.useState(!1), [ m, j ] = z3.useState(null), [ V1, k ] = z3.useState(null), [ j1, H1 ] = z3.useState(null), [ $1, F1 ] = z3.useState(X ?? []), [ u, I1 ] = z3.useState(""), [ m1, l1 ] = z3.useState("prompt"), [ a1, N0 ] = z3.useState(0), [ f0, G2 ] = z3.useState(!1), [ J0, G1 ] = z3.useState(!1), [ f1, Q1 ] = z3.useState(Q2().hasAcknowledgedCostThreshold), [ h1, s1 ] = z3.useState(new Set()), [ V0, i ] = z3.useState(null), o = z3.useCallback((C0, j0) => {
        return new Promise(K0 => {
            i({
                m1: C0,
                m2: j0,
                resolve: K0
            });
        });
    }, []), d1 = z3.useRef({}), {
        status: v1,
        reverify: R1
    } = yT2();
    function q1() {
        if (!L) return;
        if (P(!1), j1) j1.onAbort(); else M?.abort();
    }
    OT2(k, H1, i, q1, L, f0, M?.signal), z3.useEffect(() => {
        if (Q) z(C0 => C0 + 1), U(null), F1(Q);
    }, [ Q ]), z3.useEffect(() => {
        if (Gz() >= 5 && !J0 && !f1) B0("tengu_cost_threshold_reached", {}), G1(!0);
    }, [ $1, J0, f1 ]);
    let n1 = TT2(H1);
    async function g1() {
        if (R1(), !W) return;
        P(!0);
        let C0 = new AbortController();
        S(C0);
        let j0 = await U8(), K0 = await R01(W, "prompt", k, {
            abortController: C0,
            options: {
                commands: I,
                forkNumber: K,
                messageLogName: B,
                tools: V,
                verbose: J,
                slowAndCapableModel: j0,
                maxThinkingTokens: 0,
                allowedToolsFromCLIFlag: D
            },
            messages: $1,
            setForkConvoWithMessagesOnTheNextRender: U,
            setMessages: F1,
            readFileTimestamps: d1.current
        }, null, h1);
        if (K0.length) {
            for (let k0 of K0) if (k0.type === "user") MJ(W);
            if (F1(k0 => [ ...k0, ...K0 ]), K0[K0.length - 1].type === "assistant") {
                S(null), P(!1);
                return;
            }
            let [ c4, m0, C2, W2 ] = await Promise.all([ SE(), FG(), U8(), Nb([ ...$1, ...K0 ]) ]);
            for await (let k0 of TX([ ...$1, ...K0 ], c4, m0, n1, {
                options: {
                    commands: I,
                    forkNumber: K,
                    messageLogName: B,
                    tools: V,
                    slowAndCapableModel: C2,
                    verbose: J,
                    permissionMode: G,
                    maxThinkingTokens: W2,
                    allowedToolsFromCLIFlag: D
                },
                readFileTimestamps: d1.current,
                abortController: C0,
                setToolJSX: k
            }, h1, o)) F1(c0 => [ ...c0, k0 ]);
        } else MJ(W);
        Q1(Q2().hasAcknowledgedCostThreshold || !1), P(!1);
    }
    async function L1(C0, j0) {
        F1(W2 => [ ...W2, ...C0 ]), If();
        let K0 = C0[C0.length - 1];
        if (K0.type === "user" && typeof K0.message.content === "string") QS2(K0.message.content);
        if (K0.type === "assistant") {
            S(null), P(!1);
            return;
        }
        let [ w2, c4, m0, C2 ] = await Promise.all([ SE(), FG(), U8(), Nb([ ...$1, K0 ]) ]);
        for await (let W2 of TX([ ...$1, K0 ], w2, c4, n1, {
            options: {
                commands: I,
                forkNumber: K,
                messageLogName: B,
                tools: V,
                slowAndCapableModel: m0,
                verbose: J,
                permissionMode: G,
                maxThinkingTokens: C2,
                allowedToolsFromCLIFlag: D
            },
            readFileTimestamps: d1.current,
            abortController: j0,
            setToolJSX: k
        }, h1, o)) F1(k0 => [ ...k0, W2 ]);
        P(!1);
    }
    oD2(), jT2($1, B, K), uT2(), z3.useEffect(() => {
        g1();
    }, []);
    let k1 = z3.useMemo(() => Zd($1).filter(C0 => C0.surface !== "server").filter(v01), [ $1 ]), n = z3.useMemo(() => E01(k1), [ k1 ]), D1 = z3.useMemo(() => uP2(k1), [ k1 ]), Y0 = z3.useMemo(() => new Set(yP2(k1).map(C0 => C0.message.content[0].id)), [ k1 ]), r1 = P00(), z0 = z3.useMemo(() => {
        return [ {
            type: "static",
            jsx: r4.createElement(p, {
                flexDirection: "column",
                key: `logo${K}`
            }, r4.createElement(DW0, {
                mcpClients: Y,
                isDefaultModel: A
            }), r4.createElement(TW1, {
                workspaceDir: r8()
            }))
        }, ...[], ...LP2(k1).map(C0 => {
            let j0 = jf1(C0), K0 = C0.type === "progress" ? C0.content.message.content[0]?.type === "text" && C0.content.message.content[0].text === IW ? r4.createElement(SN, {
                message: C0.content,
                messages: C0.normalizedMessages,
                addMargin: !1,
                tools: C0.tools,
                verbose: J ?? !1,
                debug: Z,
                erroredToolUseIDs: new Set(),
                inProgressToolUseIDs: new Set(),
                unresolvedToolUseIDs: new Set(),
                shouldAnimate: !1,
                shouldShowDot: !1
            }) : r4.createElement(Bd, null, r4.createElement(SN, {
                message: C0.content,
                messages: C0.normalizedMessages,
                addMargin: !1,
                tools: C0.tools,
                verbose: J ?? !1,
                debug: Z,
                erroredToolUseIDs: new Set(),
                inProgressToolUseIDs: new Set(),
                unresolvedToolUseIDs: C0.isResolved ? new Set() : new Set([ C0.content.message.content[0].id ]),
                shouldAnimate: !1,
                shouldShowDot: !1
            })) : r4.createElement(SN, {
                message: C0,
                messages: k1,
                addMargin: !0,
                tools: V,
                verbose: J,
                debug: Z,
                erroredToolUseIDs: Y0,
                inProgressToolUseIDs: D1,
                shouldAnimate: !V1 && !j1 && !f0 && (!j0 || D1.has(j0)),
                shouldShowDot: !0,
                unresolvedToolUseIDs: n
            }), w2 = pP3(C0, k1, n) ? "static" : "transient";
            if (Z) return {
                type: w2,
                jsx: r4.createElement(p, {
                    borderStyle: "single",
                    borderColor: w2 === "static" ? "green" : "red",
                    key: C0.uuid,
                    width: "100%"
                }, K0)
            };
            return {
                type: w2,
                jsx: r4.createElement(p, {
                    key: C0.uuid,
                    width: "100%"
                }, K0)
            };
        }) ];
    }, [ K, Y, A, r1, k1, J, Z, V, Y0, D1, V1, j1, f0, n ]), s0 = !L && J0;
    return r4.createElement(r4.Fragment, null, r4.createElement(nU, {
        key: `static-messages-${K}`,
        items: z0.filter(C0 => C0.type === "static")
    }, C0 => C0.jsx), z0.filter(C0 => C0.type === "transient").map(C0 => C0.jsx), r4.createElement(p, {
        borderColor: "red",
        borderStyle: Z ? "single" : void 0,
        flexDirection: "column",
        width: "100%"
    }, !V1 && !j1 && !V0 && L && r4.createElement(e11, null), V1 ? V1.jsx : null, !1, !V1 && j1 && !f0 && !V0 && r4.createElement(tm2, {
        onDone: () => H1(null),
        setWriteFileAllowedDirectories: s1,
        toolUseConfirm: j1,
        verbose: J
    }), !V1 && !j1 && !f0 && !V0 && s0 && r4.createElement(YW0, {
        onDone: () => {
            G1(!1), Q1(!0);
            let C0 = Q2();
            i4({
                ...C0,
                hasAcknowledgedCostThreshold: !0
            }), B0("tengu_cost_threshold_acknowledged", {});
        }
    }), !j1 && !V1?.shouldHidePromptInput && w && !f0 && !V0 && !s0 && r4.createElement(r4.Fragment, null, r4.createElement(LT2, {
        allowedToolsFromCLIFlag: D,
        commands: I,
        forkNumber: K,
        messageLogName: B,
        tools: V,
        isDisabled: v1 === "invalid",
        isLoading: L,
        onQuery: L1,
        debug: Z,
        verbose: J,
        messages: $1,
        setToolJSX: k,
        onAutoUpdaterResult: j,
        autoUpdaterResult: m,
        input: u,
        onInputChange: I1,
        mode: m1,
        onModeChange: l1,
        submitCount: a1,
        onSubmitCountChange: N0,
        setIsLoading: P,
        setAbortController: S,
        onShowMessageSelector: () => G2(C0 => !C0),
        setForkConvoWithMessagesOnTheNextRender: U,
        setMessages: F1,
        readFileTimestamps: d1.current,
        permissionMode: G || "default",
        writeFileAllowedDirectories: h1,
        setWriteFileAllowedDirectories: s1
    }))), f0 && r4.createElement(Ju2, {
        erroredToolUseIDs: Y0,
        unresolvedToolUseIDs: n,
        messages: yE($1),
        onSelect: async C0 => {
            if (G2(!1), !$1.includes(C0)) return;
            q1(), setImmediate(async () => {
                if (await w8(), F1([]), U($1.slice(0, $1.indexOf(C0))), typeof C0.message.content === "string") I1(C0.message.content);
            });
        },
        onEscape: () => G2(!1),
        tools: V
    }), r4.createElement(R5, null));
}

function pP3(I, G, Z) {
    switch (I.type) {
      case "user":
      case "assistant":
        {
            let d = jf1(I);
            if (!d) return !0;
            if (Z.has(d)) return !1;
            let W = G.find(B => B.type === "progress" && B.toolUseID === d);
            if (!W) return !0;
            return !Tf1(Z, W.siblingToolUseIDs);
        }

      case "progress":
        return !Tf1(Z, I.siblingToolUseIDs);
    }
}

var Wb2 = A1(db2(), 1), {
    program: mw6,
    createCommand: Tw6,
    createArgument: bw6,
    createOption: jw6,
    CommanderError: lw6,
    InvalidArgumentError: kw6,
    InvalidOptionArgumentError: xw6,
    Command: Bb2,
    Argument: hw6,
    Option: cw6,
    Help: pw6
} = Wb2.default;

async function wb2({
    commands: I,
    permissionMode: G,
    hasPermissionsToUseTool: Z,
    messageLogName: d,
    prompt: W,
    cwd: B,
    tools: w,
    verbose: V = !1,
    allowedToolsFromCLIFlag: C,
    writeFileAllowedDirectories: X
}) {
    await qC(B);
    let A = [ h9({
        content: W,
        surface: "both"
    }) ], [ D, J, K ] = await Promise.all([ SE(), FG(), U8() ]);
    for await (let U of TX(A, D, J, Z, {
        options: {
            commands: I,
            tools: w,
            verbose: V,
            permissionMode: G,
            slowAndCapableModel: K,
            forkNumber: 0,
            messageLogName: "unused",
            maxThinkingTokens: 0,
            allowedToolsFromCLIFlag: C
        },
        abortController: new AbortController(),
        readFileTimestamps: {}
    }, X)) A.push(U);
    let z = UY(A);
    if (!z || z.type !== "assistant") throw new Error("Expected content to be an assistant message");
    if (z.message.content[0]?.type !== "text") throw new Error(`Expected first content item to be text, but got ${JSON.stringify(z.message.content[0], null, 2)}`);
    let Q = JC(d, 0, 0);
    return Mg(Q, $g(A)), {
        resultText: z.message.content[0].text,
        totalCost: Gz(),
        totalApiDurationMs: RS(),
        totalApiDurationMsWithoutRetries: m61(),
        numTurns: A.length - 1,
        messageHistoryFile: Q
    };
}

var IE1 = A1(u1(), 1);

import {
    EOL as Ou3
} from "os";

var yu3 = [ _G, W7, CZ, fI, YV, OB ];

async function tv1(I) {
    return (await (I === "dangerouslySkipPermissions" ? y21() : yu3)).filter(G => G.name !== SJ.name);
}

async function Vb2(I) {
    return `Launch a new agent that has access to the following tools: ${(await tv1(I)).map(d => d.name).join(", ")}. When you are searching for a keyword or file and are not confident that you will find the right match on the first try, use the Agent tool to perform the search for you. For example:

- If you are searching for a keyword like "config" or "logger", or for questions like "which file does X?", the Agent tool is strongly recommended
- If you want to read a specific file path, use the ${_G.name} or ${W7.name} tool instead of the Agent tool, to find the match more quickly
- If you are searching for a specific class definition like "class Foo", use the ${W7.name} tool instead, to find the match more quickly

Usage notes:
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each agent invocation is stateless. You will not be able to send additional messages to the agent, nor will the agent be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted${I === "dangerouslySkipPermissions" ? "" : `
5. IMPORTANT: The agent can not use ${j4.name}, ${y7.name}, ${DG.name}, ${HG.name}, so can not modify files. If you want to use these tools, use them directly instead of going through the agent.`}`;
}

var mu3 = e.object({
    prompt: e.string().describe("The task for the agent to perform")
}), SJ = {
    async prompt({
        permissionMode: I
    }) {
        return await Vb2(I || "default");
    },
    name: ZE,
    async description() {
        return "Launch a new task";
    },
    inputSchema: mu3,
    async *call({
        prompt: I
    }, {
        abortController: G,
        options: {
            allowedToolsFromCLIFlag: Z,
            permissionMode: d = "default",
            forkNumber: W,
            messageLogName: B,
            verbose: w
        },
        readFileTimestamps: V
    }, C, X, Y) {
        let A = Date.now(), D = await tv1(d), J = [ h9({
            content: I,
            surface: "both"
        }) ], K = `agent_${X.message.id}`;
        yield {
            type: "progress",
            content: K6({
                content: T0.dim("Initializing…"),
                surface: "both"
            }),
            normalizedMessages: Zd(J),
            parentMessageID: X.message.id,
            toolUseID: K,
            tools: D,
            isResolved: !1
        };
        let [ z, Q, U, M ] = await Promise.all([ C$2(), FG(), U8(), Nb(J) ]), S = 0, L = x2(() => ix1(B, W));
        for await (let V1 of TX(J, z, Q, EJ, {
            abortController: G,
            options: {
                allowedToolsFromCLIFlag: Z,
                permissionMode: d,
                forkNumber: W,
                messageLogName: B,
                tools: D,
                commands: [],
                verbose: w,
                slowAndCapableModel: U,
                maxThinkingTokens: M
            },
            readFileTimestamps: V
        }, Y)) {
            if (J.push(V1), Mg(JC(B, W, L()), $g(J)), V1.type !== "assistant") continue;
            let k = Zd(J);
            for (let j1 of V1.message.content) {
                if (j1.type !== "tool_use") continue;
                S++, yield {
                    type: "progress",
                    content: k.find(H1 => H1.type === "assistant" && H1.message.content[0]?.type === "tool_use" && H1.message.content[0].id === j1.id),
                    normalizedMessages: k,
                    tools: D,
                    parentMessageID: X.message.id,
                    toolUseID: K,
                    isResolved: !1
                };
            }
        }
        let P = Zd(J), m = UY(J);
        if (m?.type !== "assistant") throw new Error("Last message was not an assistant message");
        if (m.message.content.some(V1 => V1.type === "text" && V1.text === IW)) yield {
            type: "progress",
            content: m,
            normalizedMessages: P,
            tools: D,
            parentMessageID: X.message.id,
            toolUseID: K,
            isResolved: !1
        }; else {
            let V1 = [ S === 1 ? "1 tool use" : `${S} tool uses`, rD2((m.message.usage.cache_creation_input_tokens ?? 0) + (m.message.usage.cache_read_input_tokens ?? 0) + m.message.usage.input_tokens + m.message.usage.output_tokens) + " tokens", jv(Date.now() - A) ];
            yield {
                type: "progress",
                content: K6({
                    content: `Done (${V1.join(" · ")})`,
                    surface: "both"
                }),
                normalizedMessages: P,
                tools: D,
                parentMessageID: X.message.id,
                toolUseID: K,
                isResolved: !0
            };
        }
        let j = m.message.content.filter(V1 => V1.type === "text");
        yield {
            type: "result",
            data: j,
            normalizedMessages: P,
            resultForAssistant: this.renderResultForAssistant(j),
            tools: D
        };
    },
    isReadOnly() {
        return !0;
    },
    async isEnabled() {
        return !0;
    },
    userFacingName() {
        return "Task";
    },
    needsPermissions() {
        return !1;
    },
    renderResultForAssistant(I) {
        return I;
    },
    renderToolUseMessage({
        prompt: I
    }, {
        verbose: G
    }) {
        let Z = I.split(Ou3);
        return aE(!G && Z.length > 1 ? Z[0] + "…" : I);
    },
    renderToolUseRejectedMessage() {
        return IE1.createElement(E5, null);
    }
};

var lN = A1(u1(), 1);

var Cb2 = `You are an expert software architect. Your role is to analyze technical requirements and produce clear, actionable implementation plans.
These plans will then be carried out by a junior software engineer so you need to be specific and detailed. However do not actually write the code, just explain the plan.

Follow these steps for each request:
1. Carefully analyze requirements to identify core functionality and constraints
2. Define clear technical approach with specific technologies and patterns
3. Break down implementation into concrete, actionable steps at the appropriate level of abstraction

Keep responses focused, specific and actionable. 

IMPORTANT: Do not ask the user if you should implement the changes at the end. Just provide the plan as described above.
IMPORTANT: Do not attempt to write the code or use any string modification tools. Just provide the plan.`, GE1 = "Your go-to tool for any technical or coding task. Analyzes requirements and breaks them down into clear, actionable implementation steps. Use this whenever you need help planning how to implement a feature, solve a technical problem, or structure your code.";

var Tu3 = [ j4, fI, _G, y7, W7, CZ ], bu3 = e.strictObject({
    prompt: e.string().describe("The technical request or coding task to analyze"),
    context: e.string().describe("Optional context from previous conversation or system state").optional()
}), Xb2 = {
    name: "Architect",
    async description() {
        return GE1;
    },
    inputSchema: bu3,
    isReadOnly() {
        return !0;
    },
    userFacingName() {
        return "Architect";
    },
    async isEnabled() {
        return !1;
    },
    needsPermissions() {
        return !1;
    },
    async *call({
        prompt: I,
        context: G
    }, Z, d, W, B) {
        let w = G ? `<context>${G}</context>

${I}` : I, V = (Z.options.tools ?? []).filter(D => Tu3.map(J => J.name).includes(D.name)), X = [ h9({
            content: w,
            surface: "both"
        }) ], Y = await Z_(TX(X, [ Cb2 ], await FG(), d, {
            ...Z,
            options: {
                ...Z.options,
                tools: V
            }
        }, B));
        if (Y.type !== "assistant") throw new Error("Invalid response from Claude API");
        let A = Y.message.content.filter(D => D.type === "text");
        yield {
            type: "result",
            data: A,
            resultForAssistant: this.renderResultForAssistant(A)
        };
    },
    async prompt() {
        return GE1;
    },
    renderResultForAssistant(I) {
        return I;
    },
    renderToolUseMessage(I) {
        return Object.entries(I).map(([ G, Z ]) => `${G}: ${JSON.stringify(Z)}`).join(", ");
    },
    renderToolResultMessage(I) {
        return lN.createElement(p, {
            flexDirection: "column",
            gap: 1
        }, lN.createElement(SX, {
            code: I.map(G => G.text).join(`
`),
            language: "markdown"
        }));
    },
    renderToolUseRejectedMessage() {
        return lN.createElement(E5, null);
    }
};

var ku3 = A1(u1(), 1);

var ju3 = `Restarts ${b2}.`, lu3 = `Use this tool to restart ${b2} after making code changes to ${b2} and building them succefully if you next need to test them. The current conversation will be preserved.`;

var XC6 = e.object({
    reason: e.string().optional().describe("Optional reason for the restart")
});

var xu3 = A1(u1(), 1);

var vC6 = x2(async () => {
    let I = [ SJ, j4, W7, CZ, fI, _G, DG, y7, YV, HG, ...[], ...await g01() ], G = await Promise.all(I.map(Z => Z.isEnabled()));
    return I.filter((Z, d) => G[d]);
});

var jC6 = e.strictObject({
    description: e.string().describe("A short (3-5 word) description of the batch operation"),
    invocations: e.array(e.object({
        tool_name: e.string().describe("The name of the tool to invoke"),
        input: e.record(e.any()).describe("The input to pass to the tool")
    })).describe("The list of tool invocations to execute")
});

var y21 = x2(async I => {
    let G = [ SJ, j4, W7, CZ, fI, _G, DG, y7, YV, HG, ...[], ...[], ...await g01() ];
    if (I) G.push(Xb2);
    let Z = await Promise.all(G.map(d => d.isEnabled()));
    return G.filter((d, W) => Z[W]);
});

var lB = A1(u1(), 1);

var K_ = A1(u1(), 1);

function Yb2({
    stepIndex: I,
    totalSteps: G,
    wizardSteps: Z
}) {
    let d = e1(), W = Z[I], B = I > 0 && W && W.getPrevStepId !== void 0;
    return K_.default.createElement(p, {
        marginTop: 1
    }, B && K_.default.createElement(K_.default.Fragment, null, K_.default.createElement(O, {
        dimColor: !0
    }, K_.default.createElement(O, {
        color: d.suggestion
    }, "Esc"), " to go back"), K_.default.createElement(O, {
        dimColor: !0
    }, " • ")), K_.default.createElement(O, {
        dimColor: !0
    }, K_.default.createElement(O, {
        color: d.suggestion
    }, "Enter"), I === G - 1 ? " to finish" : " to continue"));
}

var _2 = A1(u1(), 1);

function Ab2({
    theme: I
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Add MCP Server"), _2.default.createElement(O, null, "Let's set up a new MCP (Model Context Protocol) server."), _2.default.createElement(O, null, "MCP servers allow you to extend Claude Code with custom tools and prompts."), _2.default.createElement(p, null, _2.default.createElement(O, {
        dimColor: !0
    }, "Learn more about MCP at", " ", _2.default.createElement(O, {
        color: I.suggestion
    }, "https://modelcontextprotocol.io/"))));
}

function _b2({
    state: I,
    updateState: G,
    goToNextStep: Z,
    cursorOffset: d,
    setCursorOffset: W,
    textInputColumns: B,
    currentStepId: w
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 1/6: Server Name"), _2.default.createElement(O, null, "Choose a unique name for your MCP server. This is how you'll refer to it in Claude Code."), _2.default.createElement(p, {
        flexDirection: "row",
        gap: 1
    }, _2.default.createElement(O, null, ">"), _2.default.createElement(MB, {
        placeholder: "my-server",
        value: I.serverName,
        onChange: V => G({
            serverName: V
        }),
        onSubmit: () => I.serverName.trim() && Z(),
        columns: B,
        cursorOffset: d,
        onChangeCursorOffset: W,
        showCursor: !0,
        focus: w === "name"
    })));
}

function Hb2({
    state: I,
    updateState: G,
    setCurrentStepId: Z,
    theme: d
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0,
        color: d.warning
    }, "Name Already Exists"), _2.default.createElement(O, null, "A server named ", _2.default.createElement(O, {
        bold: !0
    }, I.serverName), " already exists in the ", I.scope, " scope."), _2.default.createElement(O, null, "What would you like to do?"), _2.default.createElement(p, {
        marginTop: 1
    }, _2.default.createElement(tI, {
        options: [ {
            label: "Rename (choose a different name)",
            value: "rename"
        }, {
            label: "Continue with a different scope",
            value: "scope"
        }, {
            label: "Overwrite the existing server",
            value: "overwrite"
        } ],
        onChange: W => {
            if (W === "rename") Z("name"), G({
                serverName: ""
            }); else if (W === "scope") Z("scope"); else if (W === "overwrite") Z("command");
        }
    })));
}

function Db2({
    updateState: I,
    setCurrentStepId: G
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 2/6: Server Scope"), _2.default.createElement(O, null, "Choose where this server will be available:"), _2.default.createElement(O, {
        dimColor: !0
    }, "- Project: Only available in the current project directory"), _2.default.createElement(O, {
        dimColor: !0
    }, "- Global: Available in all projects"), _2.default.createElement(p, {
        marginTop: 1
    }, _2.default.createElement(tI, {
        options: [ {
            label: "Project (recommended)",
            value: "project"
        }, {
            label: "Global",
            value: "global"
        } ],
        onChange: d => {
            I({
                scope: d
            }), Z();
        }
    })));
    function Z() {
        G("command");
    }
}

function Fb2({
    state: I,
    updateState: G,
    goToNextStep: Z,
    cursorOffset: d,
    setCursorOffset: W,
    textInputColumns: B,
    currentStepId: w
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 3/6: Server Command"), _2.default.createElement(O, null, "Enter the command to start your MCP server."), _2.default.createElement(O, {
        dimColor: !0
    }, "Examples: /full/path/to/server.js, npx, uvx, python"), _2.default.createElement(p, {
        flexDirection: "row",
        gap: 1,
        marginTop: 1
    }, _2.default.createElement(O, null, ">"), _2.default.createElement(MB, {
        placeholder: "path/to/server",
        value: I.command,
        onChange: V => G({
            command: V
        }),
        onSubmit: () => I.command.trim() && Z(),
        columns: B,
        cursorOffset: d,
        onChangeCursorOffset: W,
        showCursor: !0,
        focus: w === "command"
    })));
}

function Jb2({
    state: I,
    updateState: G,
    goToNextStep: Z,
    cursorOffset: d,
    setCursorOffset: W,
    textInputColumns: B,
    currentStepId: w
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 4/6: Command Arguments"), _2.default.createElement(O, null, "Enter any arguments to pass to the command (optional)."), _2.default.createElement(O, {
        dimColor: !0
    }, "Example: -p 8080 --verbose"), _2.default.createElement(p, {
        flexDirection: "row",
        gap: 1,
        marginTop: 1
    }, _2.default.createElement(O, null, ">"), _2.default.createElement(MB, {
        placeholder: "arg1 arg2",
        value: I.args,
        onChange: V => G({
            args: V
        }),
        onSubmit: Z,
        columns: B,
        cursorOffset: d,
        onChangeCursorOffset: W,
        showCursor: !0,
        focus: w === "args"
    })));
}

function Kb2({
    state: I,
    updateState: G,
    goToNextStep: Z,
    cursorOffset: d,
    setCursorOffset: W,
    textInputColumns: B,
    currentStepId: w
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 5/6: Environment Variables"), _2.default.createElement(O, null, "Enter any environment variables for the server (optional)."), _2.default.createElement(O, {
        dimColor: !0
    }, "Format: KEY1=value1, KEY2=value2 (comma or newline separated)"), _2.default.createElement(p, {
        flexDirection: "row",
        gap: 1,
        marginTop: 1
    }, _2.default.createElement(O, null, ">"), _2.default.createElement(MB, {
        placeholder: "API_KEY=abc123",
        value: I.envVars,
        onChange: V => G({
            envVars: V
        }),
        onSubmit: Z,
        columns: B,
        cursorOffset: d,
        onChangeCursorOffset: W,
        showCursor: !0,
        focus: w === "env"
    })));
}

function zb2({
    state: I,
    isAdding: G,
    error: Z,
    goToPrevStep: d,
    handleAddServer: W,
    theme: B
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        bold: !0
    }, "Step 6/6: Review and Confirm"), _2.default.createElement(p, {
        flexDirection: "column",
        paddingLeft: 1
    }, _2.default.createElement(O, null, "Name: ", _2.default.createElement(O, {
        color: B.success
    }, I.serverName)), _2.default.createElement(O, null, "Scope: ", _2.default.createElement(O, {
        color: B.success
    }, I.scope)), _2.default.createElement(O, null, "Command: ", _2.default.createElement(O, {
        color: B.success
    }, I.command)), I.args && _2.default.createElement(O, null, "Arguments: ", _2.default.createElement(O, {
        color: B.success
    }, I.args)), I.envVars && _2.default.createElement(O, null, "Environment: ", _2.default.createElement(O, {
        color: B.success
    }, I.envVars))), G ? _2.default.createElement(p, {
        marginTop: 1,
        paddingLeft: 1
    }, _2.default.createElement(UN, null), _2.default.createElement(O, null, "Adding MCP server...")) : _2.default.createElement(p, {
        marginTop: 1,
        flexDirection: "column",
        gap: 1
    }, Z && _2.default.createElement(O, {
        color: B.error
    }, "Error: ", Z), _2.default.createElement(p, null, _2.default.createElement(tI, {
        options: [ {
            label: "Confirm",
            value: "add"
        }, {
            label: "Go back",
            value: "edit"
        } ],
        onChange: w => {
            if (w === "add") W(); else d();
        }
    }))));
}

function Qb2({
    state: I,
    theme: G
}) {
    return _2.default.createElement(p, {
        flexDirection: "column",
        gap: 1,
        paddingLeft: 1
    }, _2.default.createElement(O, {
        color: G.success
    }, "✓ MCP Server added successfully!"), _2.default.createElement(O, null, 'Your server "', I.serverName, '" has been added to the', " ", I.scope, " configuration."), _2.default.createElement(O, null, "You can now use it with Claude Code."), _2.default.createElement(p, {
        marginTop: 1
    }, _2.default.createElement(O, {
        dimColor: !0
    }, "You can view your server with: claude mcp get ", I.serverName)), _2.default.createElement(p, null, _2.default.createElement(O, {
        dimColor: !0
    }, "You can modify or remove it with: claude mcp remove ", I.serverName)));
}

var hu3 = {
    serverName: "",
    scope: "project",
    command: "",
    args: "",
    envVars: ""
}, O21 = [ {
    id: "welcome",
    getNextStepId: () => "name",
    component: Ab2
}, {
    id: "name",
    getNextStepId: () => "scope",
    component: _b2
}, {
    id: "scope",
    getNextStepId: I => {
        let G = yT(I.serverName);
        if (G && G.scope === I.scope && I.serverName.trim()) return "name-validation";
        return "command";
    },
    getPrevStepId: () => "name",
    component: Db2
}, {
    id: "name-validation",
    getNextStepId: () => null,
    getPrevStepId: () => "scope",
    component: Hb2
}, {
    id: "command",
    getNextStepId: () => "args",
    getPrevStepId: () => "scope",
    component: Fb2
}, {
    id: "args",
    getNextStepId: () => "env",
    getPrevStepId: () => "command",
    component: Jb2
}, {
    id: "env",
    getNextStepId: () => "confirm",
    getPrevStepId: () => "args",
    component: Kb2
}, {
    id: "confirm",
    getNextStepId: () => "success",
    getPrevStepId: () => "env",
    component: zb2
}, {
    id: "success",
    getNextStepId: () => null,
    component: Qb2
} ];

function Nb2({
    onDone: I
}) {
    let G = e1(), [ Z, d ] = lB.useState("welcome"), [ W, B ] = lB.useState(hu3), [ w, V ] = lB.useState(0), [ C, X ] = lB.useState(null), [ Y, A ] = lB.useState(!1), D = Q5().columns - 6, J = O21.find(P => P.id === Z);
    if (!J) {
        let P = new Error("No current step");
        throw W0(P), P;
    }
    let K = J ? O21.indexOf(J) : 0, z = P => {
        B(m => ({
            ...m,
            ...P
        }));
    };
    function Q() {
        if (!J) return;
        let P = J.getNextStepId(W);
        if (P) d(P);
    }
    function U() {
        if (!J) return;
        if (Z === "confirm" && C) X(null);
        if (!J.getPrevStepId) {
            let m = new Error("No previous step");
            throw W0(m), m;
        }
        let P = J.getPrevStepId(W);
        if (P) d(P);
    }
    _4((P, m) => {
        if (m.escape && Z !== "success") U();
        if (m.return && J && [ "welcome", "success" ].includes(J.id)) {
            if (J.id === "welcome") Q(); else if (J.id === "success") I();
        }
    });
    async function M() {
        A(!0), X(null);
        try {
            let P = W.envVars.split(/[\n,]/).map(j => j.trim()).filter(Boolean), m = W.args.split(/\s+/).filter(Boolean);
            B0("tengu_mcp_add", {
                name: W.serverName,
                type: "stdio",
                scope: W.scope
            }), uT(W.serverName, {
                type: "stdio",
                command: W.command,
                args: m,
                env: N01(P)
            }, W.scope), B0("tengu_mcp_add_wizard_complete", {
                scope: W.scope
            }), Q();
        } catch (P) {
            X(P.message), W0(P), A(!1);
        }
    }
    let S = {
        state: W,
        updateState: z,
        goToNextStep: Q,
        goToPrevStep: U,
        setCurrentStepId: d,
        currentStepId: Z,
        cursorOffset: w,
        setCursorOffset: V,
        textInputColumns: D,
        error: C,
        setError: X,
        isAdding: Y,
        setIsAdding: A,
        theme: G,
        handleAddServer: M
    }, L = J.component;
