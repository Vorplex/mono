import type { JSX } from "solid-js";
import { For, batch, createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from "solid-js";

export type ItemKey = string | number;

class FenwickTree {
    private readonly tree: Float64Array;

    constructor(size: number, valueAt?: (index: number) => number) {
        this.tree = new Float64Array(size + 1);
        if (!valueAt) return;

        for (let index = 0; index < size; index++) {
            const cursor = index + 1;
            this.tree[cursor]! += valueAt(index);
            const parent = cursor + (cursor & -cursor);
            if (parent <= size) this.tree[parent]! += this.tree[cursor]!;
        }
    }

    add(index: number, delta: number): void {
        for (let cursor = index + 1; cursor < this.tree.length; cursor += cursor & -cursor) {
            this.tree[cursor]! += delta;
        }
    }

    prefix(endExclusive: number): number {
        let total = 0;
        for (let cursor = endExclusive; cursor > 0; cursor -= cursor & -cursor) total += this.tree[cursor]!;
        return total;
    }
}

export interface VirtualRange {
    start: number;
    end: number;
    before: number;
    after: number;
}

export class VirtualSizeIndex {
    private keys: ItemKey[] = [];
    private indexes = new Map<ItemKey, number>();
    private readonly measured = new Map<ItemKey, number>();
    private deltas = new FenwickTree(0);
    private estimate: number | undefined;
    private gap = 0;

    get count(): number {
        return this.keys.length;
    }

    get hasEstimate(): boolean {
        return this.estimate !== undefined;
    }

    getKey(index: number): ItemKey {
        this.assertIndex(index);
        return this.keys[index]!;
    }

    getIndex(key: ItemKey): number | undefined {
        return this.indexes.get(key);
    }

    isMeasured(key: ItemKey): boolean {
        return this.measured.has(key);
    }

    reconcile(nextKeys: readonly ItemKey[]): void {
        const indexes = new Map<ItemKey, number>();
        for (let index = 0; index < nextKeys.length; index++) {
            const key = nextKeys[index];
            if ((typeof key !== "string" && typeof key !== "number") || (typeof key === "number" && !Number.isFinite(key))) {
                throw new Error("DynamicVirtualList item keys must be strings or finite numbers");
            }
            if (indexes.has(key)) {
                throw new Error(`DynamicVirtualList requires unique item keys; duplicate key: ${String(key)}`);
            }
            indexes.set(key, index);
        }

        const hadKeys = this.keys.length > 0;
        let survivors = 0;
        for (const key of this.keys) if (indexes.has(key)) survivors++;
        for (const key of this.measured.keys()) if (!indexes.has(key)) this.measured.delete(key);

        if (nextKeys.length === 0 || (hadKeys && survivors === 0)) {
            this.measured.clear();
            this.estimate = undefined;
        }

        this.keys = Array.from(nextKeys);
        this.indexes = indexes;
        this.rebuild();
    }

    setGap(gap: number): boolean {
        if (!Number.isFinite(gap) || gap < 0) throw new RangeError("gap must be a finite, non-negative number");
        if (gap === this.gap) return false;
        this.gap = gap;
        return true;
    }

    measure(key: ItemKey, size: number): boolean {
        const index = this.indexes.get(key);
        if (index === undefined) return false;
        if (!Number.isFinite(size) || size <= 0) {
            throw new RangeError(`Virtualized items must have a positive height; key ${String(key)} measured ${size}`);
        }

        const previous = this.measured.get(key);
        if (previous === size) return false;
        this.measured.set(key, size);

        if (this.estimate === undefined) {
            this.estimate = size;
            this.rebuild();
        } else {
            this.deltas.add(index, previous === undefined ? size - this.estimate : size - previous);
        }
        return true;
    }

    itemSize(index: number): number {
        this.assertReady();
        this.assertIndex(index);
        return this.measured.get(this.keys[index]!) ?? this.estimate!;
    }

    itemTop(index: number): number {
        this.assertReady();
        this.assertIndex(index);
        return this.sizePrefix(index) + this.gap * index;
    }

    itemBottom(index: number): number {
        return this.itemTop(index) + this.itemSize(index);
    }

    totalHeight(): number {
        if (this.keys.length === 0) return 0;
        this.assertReady();
        return this.sizePrefix(this.keys.length) + this.gap * (this.keys.length - 1);
    }

    firstIndexAt(offset: number): number {
        this.assertReady();
        const count = this.keys.length;
        if (count === 0 || offset <= 0 || Number.isNaN(offset)) return 0;
        if (offset >= this.totalHeight()) return count - 1;

        let low = 0;
        let high = count;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if (this.itemBottom(middle) <= offset) low = middle + 1;
            else high = middle;
        }
        return Math.min(low, count - 1);
    }

    range(scrollTop: number, viewportHeight: number, overscan: number): VirtualRange {
        if (this.keys.length === 0 || !this.hasEstimate) return { start: 0, end: 0, before: 0, after: 0 };

        const startOffset = Math.max(0, scrollTop - overscan);
        const endOffset = Math.max(startOffset, scrollTop + viewportHeight + overscan);
        const start = this.firstIndexAt(startOffset);
        const end = Math.min(this.keys.length, Math.max(start + 1, this.firstTopAtOrAfter(endOffset)));
        return {
            start,
            end,
            before: this.itemTop(start),
            after: Math.max(0, this.totalHeight() - this.itemBottom(end - 1)),
        };
    }

    private firstTopAtOrAfter(offset: number): number {
        let low = 0;
        let high = this.keys.length;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if (this.itemTop(middle) < offset) low = middle + 1;
            else high = middle;
        }
        return low;
    }

    private sizePrefix(endExclusive: number): number {
        return this.estimate! * endExclusive + this.deltas.prefix(endExclusive);
    }

    private rebuild(): void {
        const estimate = this.estimate;
        this.deltas = new FenwickTree(
            this.keys.length,
            estimate === undefined ? undefined : (index) => (this.measured.get(this.keys[index]!) ?? estimate) - estimate,
        );
    }

    private assertReady(): void {
        if (this.estimate === undefined) throw new Error("VirtualSizeIndex has not measured its probe item yet");
    }

    private assertIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.keys.length) {
            throw new RangeError(`item index ${index} is outside 0..${Math.max(0, this.keys.length - 1)}`);
        }
    }
}

export type ScrollAlignment = "start" | "center" | "end";

export interface ScrollToIndexOptions {
    align?: ScrollAlignment;
    behavior?: ScrollBehavior;
    offset?: number;
}

export interface DynamicVirtualListHandle {
    scrollToIndex(index: number, options?: ScrollToIndexOptions): Promise<boolean>;
    scrollToOffset(offset: number, behavior?: ScrollBehavior): void;
    getScrollElement(): HTMLDivElement | undefined;
}

export interface VirtualListItem {
    key: ItemKey;
    content: (index: number) => JSX.Element;
}

export interface DynamicVirtualListProps {
    items: readonly VirtualListItem[];
    overscan?: number;
    gap?: number;
    class?: string;
    style?: JSX.CSSProperties;
    role?: string;
    tabIndex?: number;
    ariaLabel?: string;
    onRangeChange?: (startIndex: number, endIndex: number) => void;
    onError?: (error: Error) => void;
    ref?: (handle: DynamicVirtualListHandle | undefined) => void;
}

interface RowProps {
    itemKey: ItemKey;
    observe: (element: HTMLDivElement, key: ItemKey) => void;
    unobserve: (element: HTMLDivElement) => void;
    children: () => JSX.Element;
}

function MeasuredRow(props: RowProps): JSX.Element {
    let element!: HTMLDivElement;
    onMount(() => props.observe(element, props.itemKey));
    onCleanup(() => props.unobserve(element));

    return (
        <div
            ref={element}
            style="display:flow-root;width:100%;box-sizing:border-box;flex:0 0 auto;overflow-anchor:none"
        >
            {props.children()}
        </div>
    );
}

type Anchor = readonly [key: ItemKey, offset: number, index: number];

const nonNegative = (value: number | undefined, fallback: number, name: string): number => {
    const result = value ?? fallback;
    if (!Number.isFinite(result) || result < 0) throw new RangeError(`${name} must be a finite, non-negative number`);
    return result;
};

export function VirtualList(props: DynamicVirtualListProps): JSX.Element {
    const sizes = new VirtualSizeIndex();
    const gap = createMemo(() => nonNegative(props.gap, 0, "gap"));
    const overscan = createMemo(() => nonNegative(props.overscan, 500, "overscan"));
    const [scrollTop, setScrollTop] = createSignal(0);
    const [viewportHeight, setViewportHeight] = createSignal(0);
    const [layout, setLayout] = createSignal(0);
    const [itemsVersion, setItemsVersion] = createSignal(0);
    const [deviation, setDeviation] = createSignal(0);

    let scroller: HTMLDivElement | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let measureFrame = 0;
    let viewportDirty = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let scrollRequest = 0;
    let scrollRequestActive = false;
    let nativeSmooth = false;
    let mobileSafari = false;
    let deferredCorrection = 0;
    let pendingAnchor: Anchor | undefined;
    let anchorRestoreScheduled = false;

    const elementKeys = new WeakMap<Element, ItemKey>();
    const pending = new Set<HTMLDivElement>();
    const reportedZero = new Set<ItemKey>();
    const bumpLayout = (): number => setLayout((value) => value + 1);
    const logicalTop = (): number => Math.max(0, scrollTop() - deviation());
    const currentTop = (): number => (scroller ? Math.max(0, scroller.scrollTop - deviation()) : logicalTop());

    function captureAnchor(): Anchor | undefined {
        if (!scroller || !sizes.count || !sizes.hasEstimate) return undefined;
        const top = currentTop();
        const index = sizes.firstIndexAt(top);
        return [sizes.getKey(index), top - sizes.itemTop(index), index];
    }

    function retargetAnchor(anchor: Anchor | undefined, previousKeys: readonly ItemKey[] | undefined): Anchor | undefined {
        if (!anchor) return undefined;
        const currentIndex = sizes.getIndex(anchor[0]);
        if (currentIndex !== undefined) return [anchor[0], anchor[1], currentIndex];
        if (!previousKeys) return undefined;
        for (let index = anchor[2] + 1; index < previousKeys.length; index++) {
            const key = previousKeys[index]!;
            const nextIndex = sizes.getIndex(key);
            if (nextIndex !== undefined) return [key, anchor[1], nextIndex];
        }
        for (let index = anchor[2] - 1; index >= 0; index--) {
            const key = previousKeys[index]!;
            const nextIndex = sizes.getIndex(key);
            if (nextIndex !== undefined) return [key, anchor[1], nextIndex];
        }
        return undefined;
    }

    function markScrolling(): void {
        if (idleTimer !== undefined) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            idleTimer = undefined;
            nativeSmooth = false;
            flushDeferredCorrection();
        }, 120);
    }

    function flushDeferredCorrection(): void {
        if (!scroller || Math.abs(deferredCorrection) < 0.5) {
            deferredCorrection = 0;
            setDeviation(0);
            return;
        }

        const correction = deferredCorrection;
        deferredCorrection = 0;
        markScrolling();
        scroller.scrollTop += correction;
        batch(() => {
            setScrollTop(scroller!.scrollTop);
            setDeviation(0);
        });
    }

    function applyCorrection(delta: number): void {
        if (!scroller || !Number.isFinite(delta) || Math.abs(delta) < 0.5) return;

        if (mobileSafari && idleTimer !== undefined && !scrollRequestActive) {
            deferredCorrection += delta;
            setDeviation(-deferredCorrection);
            return;
        }

        if (Math.abs(deferredCorrection) >= 0.5) flushDeferredCorrection();
        markScrolling();
        scroller.scrollTop += delta;
        setScrollTop(scroller.scrollTop);
    }

    function restoreAnchor(anchor: Anchor | undefined): void {
        if (!anchor || !sizes.hasEstimate) return;
        const index = sizes.getIndex(anchor[0]);
        if (index !== undefined) applyCorrection(sizes.itemTop(index) + anchor[1] - currentTop());
    }

    function scheduleAnchorRestore(anchor: Anchor | undefined): void {
        pendingAnchor = anchor;
        if (anchorRestoreScheduled) return;
        anchorRestoreScheduled = true;
        queueMicrotask(() => {
            anchorRestoreScheduled = false;
            const next = pendingAnchor;
            pendingAnchor = undefined;
            restoreAnchor(next);
        });
    }

    function resetScroll(): void {
        deferredCorrection = 0;
        nativeSmooth = false;
        if (scroller) scroller.scrollTo({ top: 0, behavior: "auto" });
        batch(() => {
            setDeviation(0);
            setScrollTop(0);
        });
    }

    function scheduleMeasure(): void {
        if (!measureFrame) measureFrame = requestAnimationFrame(flushMeasurements);
    }

    function flushMeasurements(): void {
        measureFrame = 0;
        if (viewportDirty) {
            viewportDirty = false;
            if (scroller) setViewportHeight(scroller.clientHeight);
        }
        if (!pending.size) return;

        const anchor = scrollRequestActive ? undefined : captureAnchor();
        let changed = false;
        for (const element of pending) {
            pending.delete(element);
            if (!element.isConnected) continue;
            const key = elementKeys.get(element);
            if (key === undefined || sizes.getIndex(key) === undefined) continue;

            const height = Math.round(element.getBoundingClientRect().height);
            if (height > 0) {
                reportedZero.delete(key);
                changed = sizes.measure(key, height) || changed;
            } else if (element.getClientRects().length && !reportedZero.has(key)) {
                reportedZero.add(key);
                const error = new Error(`DynamicVirtualList item ${String(key)} has zero height`);
                props.onError ? props.onError(error) : console.error(error);
            }
        }

        if (changed) {
            bumpLayout();
            restoreAnchor(anchor);
        }
    }

    function observer(): ResizeObserver {
        if (resizeObserver) return resizeObserver;
        if (typeof ResizeObserver === "undefined") throw new Error("DynamicVirtualList requires ResizeObserver support");
        resizeObserver = new ResizeObserver((entries) => {
            if (!scroller) return;
            for (const entry of entries) {
                if (entry.target === scroller) viewportDirty = true;
                else pending.add(entry.target as HTMLDivElement);
            }
            scheduleMeasure();
        });
        return resizeObserver;
    }

    function observeItem(element: HTMLDivElement, key: ItemKey): void {
        elementKeys.set(element, key);
        pending.add(element);
        observer().observe(element);
        scheduleMeasure();
    }

    function unobserveItem(element: HTMLDivElement): void {
        resizeObserver?.unobserve(element);
        pending.delete(element);
        elementKeys.delete(element);
    }

    function handleScroll(event: Event): void {
        setScrollTop(Math.max(0, (event.currentTarget as HTMLDivElement).scrollTop));
        markScrolling();
    }

    function cancelScrollRequest(): void {
        const stopNative = scrollRequestActive || nativeSmooth;
        pendingAnchor = undefined;
        scrollRequest++;
        scrollRequestActive = false;
        nativeSmooth = false;
        if (stopNative && scroller) scroller.scrollTo({ top: scroller.scrollTop, behavior: "auto" });
    }

    const itemState = createMemo(() => {
        const items = props.items;
        return { items, keys: items.map((item) => item.key) };
    });
    let appliedItems: readonly VirtualListItem[] = [];
    let appliedKeys: readonly ItemKey[] | undefined;

    createEffect(() => {
        const state = itemState();
        const keys = state.keys;
        const nextGap = gap();
        untrack(() => {
            const previousKeys = appliedKeys;
            const keysChanged =
                !appliedKeys || appliedKeys.length !== keys.length || appliedKeys.some((key, index) => key !== keys[index]);
            let anchor = pendingAnchor ?? captureAnchor();
            let resetForReplacement = false;
            if (keysChanged) {
                const hadEstimate = sizes.hasEstimate;
                sizes.reconcile(keys);
                resetForReplacement = hadEstimate && !sizes.hasEstimate;
                anchor = retargetAnchor(anchor, previousKeys);
                for (const key of reportedZero) if (sizes.getIndex(key) === undefined) reportedZero.delete(key);
            }
            appliedItems = state.items;
            setItemsVersion((value) => value + 1);
            const gapChanged = sizes.setGap(nextGap);
            if (!keysChanged && !gapChanged) return;
            appliedKeys = keys;

            bumpLayout();
            if (!sizes.count || resetForReplacement) {
                cancelScrollRequest();
                resetScroll();
            } else {
                scheduleAnchorRestore(anchor);
            }
        });
    });

    const rendered = createMemo(() => {
        layout();
        if (!sizes.count) return { start: 0, end: 0, before: 0, after: 0, keys: [] as ItemKey[] };
        if (!sizes.hasEstimate) return { start: 0, end: 1, before: 0, after: 0, keys: [sizes.getKey(0)] };

        const range = sizes.range(logicalTop(), viewportHeight(), overscan());
        return {
            ...range,
            keys: Array.from({ length: range.end - range.start }, (_, offset) => sizes.getKey(range.start + offset)),
        };
    });

    let previousStart = -1;
    let previousEnd = -1;
    createEffect(() => {
        const range = rendered();
        if (range.start === previousStart && range.end === previousEnd) return;
        previousStart = range.start;
        previousEnd = range.end;
        if (range.end > range.start) props.onRangeChange?.(range.start, range.end - 1);
    });

    const nextFrame = (): Promise<void> =>
        new Promise((resolve) => {
            const timer = setTimeout(resolve, 50);
            requestAnimationFrame(() => {
                clearTimeout(timer);
                resolve();
            });
        });

    const waitForEstimate = async (request: number): Promise<boolean> => {
        for (let frame = 0; frame < 60; frame++) {
            if (request !== scrollRequest) return false;
            if (sizes.hasEstimate) return true;
            await nextFrame();
        }
        return sizes.hasEstimate;
    };

    const waitForSmoothScroll = async (request: number): Promise<boolean> => {
        let previous = scroller?.scrollTop ?? 0;
        let stableFrames = 0;
        const started = performance.now();
        while (performance.now() - started < 1_200) {
            if (request !== scrollRequest) return false;
            await nextFrame();
            const current = scroller?.scrollTop ?? previous;
            stableFrames = Math.abs(current - previous) < 0.5 ? stableFrames + 1 : 0;
            previous = current;
            if (performance.now() - started >= 80 && stableFrames >= 3) return true;
        }
        return true;
    };

    const targetForIndex = (index: number, options: ScrollToIndexOptions): number => {
        const top = sizes.itemTop(index);
        const size = sizes.itemSize(index);
        const viewport = scroller?.clientHeight ?? viewportHeight();
        let target = top;
        if (options.align === "center") target -= (viewport - size) / 2;
        else if (options.align === "end") target += size - viewport;
        if (Number.isFinite(options.offset)) target += options.offset!;
        return Math.max(0, Math.min(target, Math.max(0, sizes.totalHeight() - viewport)));
    };

    const scrollToIndex: DynamicVirtualListHandle["scrollToIndex"] = async (requestedIndex, options = {}) => {
        if (!scroller || !sizes.count || !Number.isFinite(requestedIndex)) return false;
        pendingAnchor = undefined;
        const request = ++scrollRequest;
        scrollRequestActive = true;
        flushDeferredCorrection();

        try {
            if (!(await waitForEstimate(request))) return false;
            const initialIndex = Math.max(0, Math.min(Math.trunc(requestedIndex), sizes.count - 1));
            const key = sizes.getKey(initialIndex);

            for (let attempt = 0; attempt < 8; attempt++) {
                if (request !== scrollRequest || !scroller) return false;
                const index = sizes.getIndex(key);
                if (index === undefined) return false;

                const behavior = attempt ? "auto" : options.behavior ?? "auto";
                nativeSmooth = behavior === "smooth";
                markScrolling();
                scroller.scrollTo({ top: targetForIndex(index, options), behavior });
                if (behavior === "auto") setScrollTop(scroller.scrollTop);

                if (behavior === "smooth") {
                    if (!(await waitForSmoothScroll(request))) return false;
                    nativeSmooth = false;
                } else {
                    await nextFrame();
                    await nextFrame();
                }

                if (request !== scrollRequest || !scroller) return false;
                const currentIndex = sizes.getIndex(key);
                if (currentIndex === undefined) return false;
                if (sizes.isMeasured(key) && Math.abs(scroller.scrollTop - targetForIndex(currentIndex, options)) <= 1) {
                    return true;
                }
            }
            return false;
        } finally {
            if (request === scrollRequest) scrollRequestActive = false;
        }
    };

    const scrollToOffset = (offset: number, behavior: ScrollBehavior = "auto"): void => {
        if (!scroller || !Number.isFinite(offset)) return;
        cancelScrollRequest();
        flushDeferredCorrection();
        nativeSmooth = behavior === "smooth";
        markScrolling();
        scroller.scrollTo({ top: Math.max(0, offset), behavior });
        if (behavior === "auto") setScrollTop(scroller.scrollTop);
    };

    onMount(() => {
        if (!scroller) return;
        const iPadDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        mobileSafari = (/iP(ad|hone|od)/.test(navigator.userAgent) || iPadDesktopMode) && /WebKit/.test(navigator.userAgent);
        setViewportHeight(scroller.clientHeight);
        setScrollTop(scroller.scrollTop);
        observer().observe(scroller);
        props.ref?.({ scrollToIndex, scrollToOffset, getScrollElement: () => scroller });
    });

    onCleanup(() => {
        cancelScrollRequest();
        resizeObserver?.disconnect();
        if (measureFrame) cancelAnimationFrame(measureFrame);
        if (idleTimer !== undefined) clearTimeout(idleTimer);
        pending.clear();
        props.ref?.(undefined);
        scroller = undefined;
    });

    return (
        <div
            ref={scroller}
            class={props.class}
            role={props.role}
            aria-label={props.ariaLabel}
            tabIndex={props.tabIndex ?? 0}
            onScroll={event => handleScroll(event)}
            onWheel={() => cancelScrollRequest()}
            onKeyDown={() => cancelScrollRequest()}
            onTouchStart={() => cancelScrollRequest()}
            onPointerDown={() => cancelScrollRequest()}
            style={{
                height: "100%",
                ...props.style,
                overflow: "auto",
                position: "relative",
                "box-sizing": "border-box",
                "overflow-anchor": "none",
                "-webkit-overflow-scrolling": "touch",
            }}
        >
            <div
                style={{
                    display: "flex",
                    "flex-direction": "column",
                    "row-gap": `${gap()}px`,
                    "box-sizing": "border-box",
                    "padding-top": `${rendered().before}px`,
                    "padding-bottom": `${rendered().after}px`,
                    transform: deviation() ? `translateY(${deviation()}px)` : undefined,
                }}
            >
                <For each={rendered().keys}>
                    {(key: ItemKey) => (
                        <MeasuredRow itemKey={key} observe={observeItem} unobserve={unobserveItem}>
                            {() => {
                                itemsVersion();
                                const index = sizes.getIndex(key);
                                return index === undefined ? undefined : appliedItems[index]!.content(index);
                            }}
                        </MeasuredRow>
                    )}
                </For>
            </div>
        </div>
    );
}
