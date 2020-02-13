type Zero = {readonly type: "Nat"};
type Nat = {readonly type: "Nat", readonly pred: Nat } | Zero;
type Add1<TNat extends Nat> = {readonly type: "Nat", readonly pred: TNat };

function isAdd1(value: Nat): value is Add1<Nat> {
    return "pred" in value;
}
function isZero(value: Nat): value is Zero {
    return !("pred" in value);
}

function zero(): Zero {
    return {type: "Nat"};
}
function add1<TValue extends Nat>(value: TValue): Add1<TValue> {
    return {type: "Nat", pred: value };
}

function whichNat<TReturn>(target: Nat, base: TReturn, step: (pred: Nat) => TReturn): TReturn {
    if (isAdd1(target)) {
        return step(target.pred);
    } else {
        return base;
    }
}

function iterNat<TReturn>(target: Nat, base: TReturn, step: (stepPred: TReturn) => TReturn): TReturn {
    if  (isAdd1(target)) {
        return step(iterNat(target.pred, base, step));
    } else {
        return base;
    }
}

function recNat<TReturn>(target: Nat, base: TReturn, step: (pred: Nat, stepPred: TReturn) => TReturn): TReturn {
    if  (isAdd1(target)) {
        return step(target.pred, recNat(target.pred, base, step));
    } else {
        return base;
    }
}

function indNever<TReturn>(target: never): TReturn {
    throw new Error("Inhabited never: " + target);
}

type VecNil = [];
type Vec<TElem, TLength extends Nat> = TLength extends Add1<infer TPred> ? { readonly head: TElem, readonly tail: Vec<TElem, TPred> } : VecNil;
type VecAppend<TElem, TLengthPred extends Nat, TTail extends Vec<TElem, TLengthPred>> = { readonly head: TElem, readonly tail: TTail };

const testVec2: Vec<string, Add1<Add1<Zero>>> = {
    head: "hey",
    tail: {
        head: "ho",
        tail: []
    }
}

function vecNil<TElem>(): Vec<TElem, Zero> {
    return [];
}
function vecAppend<TElem, TLengthPred extends Nat, TTail extends Vec<TElem, TLengthPred>>(head: TElem, lengthPred: TLengthPred, tail: TTail):
    Vec<TElem, Add1<TLengthPred>> {
    return {
        head: head,
        tail: tail
    };
}
/*interface MotiveNat<TMot, TValue extends Nat> {
    readonly _Motive: TMot,
    readonly _Value: TValue
}*/
function nPeas<TCount extends Nat>(count: TCount): Vec<"pea", TCount> {
    if (isAdd1(count)) {
        return vecAppend("pea" as const, count.pred, nPeas(count.pred)) as Vec<"pea",TCount>;
    } else if (isZero(count)) {
        return vecNil() as Vec<"pea",TCount>;
    } else {
        indNever(count);
    }
}

type MotivePeas<TCount extends Nat> = Vec<"pea", TCount>;

interface URItoNatMotive<TVal extends Nat> {
    Peas: MotivePeas<TVal>
}

type NatMotiveUris = keyof URItoNatMotive<Nat>;

type NatMotive<URI extends NatMotiveUris, TVal extends Nat> = URItoNatMotive<TVal>[URI];

function indNat<TTarget extends Nat, TMot extends NatMotiveUris>(target: TTarget, base: NatMotive<TMot, Zero>, step: <TVal extends Nat>(val: TVal, stepPred: NatMotive<TMot, TVal>) => NatMotive<TMot, Add1<TVal>>) : NatMotive<TMot, TTarget> {
    if (isAdd1(target)) {
        return step(target.pred, indNat(target.pred, base, step)) as NatMotive<TMot, TTarget>;
    } else if (isZero(target)) {
        return base;
    } else {
        return indNever(target);
    }
}

function nPeas2Step<TMot extends NatMotiveUris, TVal extends Nat>(val: TVal, stepPred: NatMotive<TMot, TVal>): NatMotive<TMot, Add1<TVal>> {
    return vecAppend("pea" as const, val, stepPred);
}
function nPeas2<TCount extends Nat>(count: TCount): Vec<"pea", TCount> {
    return indNat<TCount, "Peas">(count, vecNil(), nPeas2Step);
}

console.log(nPeas(add1(add1(add1(zero())))));
console.log(nPeas2(add1(add1(add1(zero())))));

type Nil = {readonly type: "List"};
type List<TElem> = {readonly type: "List", readonly car:TElem, readonly cdr:List<TElem>} | Nil;
interface Append<TElem, TList extends List<TElem>> { readonly type: "List", readonly car: TElem, readonly cdr: TList };

function isAppend<TElem>(es: List<TElem>): es is Append<TElem,List<TElem>> {
    return "car" in es;
}
function isNil<TElem>(es: List<TElem>): es is Nil {
    return !("car" in es);
}

function recList<TElem,TReturn>(target: List<TElem>, base: TReturn, step: (e: TElem, es: List<TElem>, stepEs: TReturn) => TReturn): TReturn {
    if ("car" in target) {
        return step(target.car, target.cdr, recList(target.cdr, base, step));
    } else {
        return base;
    }
}

interface URItoListMotive<TElem, TList extends List<TElem>> {
}

type ListMotiveUris = keyof URItoListMotive<any,List<any>>;

type ListMotive<URI extends ListMotiveUris, TElem, TList extends List<TElem>> = URItoListMotive<TElem, TList>[URI];

function indList<TElem,TTarget extends List<TElem>,TMot extends ListMotiveUris>(target: TTarget, base: ListMotive<TMot,TElem,Nil>, step: (e: TElem, es: List<TElem>, stepEs: ListMotive<TMot, TElem, List<TElem>>) => ListMotive<TMot, TElem,  Append<TElem, TTarget>>): ListMotive<TMot, TElem, TTarget> {
    if (isAppend<TElem>(target)) {
        return step(target.car, target.cdr, indList(target.cdr, base, step));
    } else if (isNil(target)){
        return base;
    } else {
        indNever(target);
    }
}