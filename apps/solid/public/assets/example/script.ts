import { noop, upperCase } from 'lodash';

export default Shtml.defineApp(shtml => class {
    constructor() {
        shtml.app.variables.app.set({ name: 'Post Manager' });
        // shtml.app.variables.app.get();
        // shtml.app.variables.app.reset();
        // shtml.app.variables.app.validate();
    }
    onMount() {
        console.log(upperCase('shtml packages are working'));
        shtml.services.logger.log('SHTML SERVICES ARE WORKING');
    }
    sum(x, y) { return x + 1; }
    // Exposes this script's own copy of a shared npm import so another script can check reference identity
    // against its own copy of the same import — see shtml/plan.md's open problem on cross-script module identity.
    getLodashNoop() { return noop; }
    async loadPosts() {
        const response = await shtml.apis.jsonPlaceholder.getPosts.request({ parameters: { _limit: 10 } });
        const posts = await response.value();
        // jsonplaceholder has no priority field — it's a client-only enrichment, derived deterministically from
        // id (rather than a fixed default) purely so the demo table shows a mix of priorities.
        const priorities = ['low', 'medium', 'high'];
        shtml.app.variables.posts.set(posts.map((post: { id: number }) => ({ ...post, priority: priorities[post.id % priorities.length] })));
    }
    async createPost(title: string, body: string, userId: number, priority: string) {
        const response = await shtml.apis.jsonPlaceholder.createPost.request({ body: { title, body, userId } });
        const created = await response.value();
        // jsonplaceholder always echoes id 101 for new posts; fake a unique id so track="id" can tell entries apart.
        shtml.app.variables.posts.set([{ ...created, id: Date.now(), priority }, ...shtml.app.variables.posts.get()]);
    }
    async updatePost(post: { id: number; title: string; body: string; userId: number; priority: string }) {
        await shtml.apis.jsonPlaceholder.updatePost.request({ parameters: { id: post.id }, body: post });
        shtml.app.variables.posts.set(shtml.app.variables.posts.get().map((existing: { id: number }) => existing.id === post.id ? post : existing));
    }
    async deletePost(id: number) {
        await shtml.apis.jsonPlaceholder.deletePost.request({ parameters: { id } });
        shtml.app.variables.posts.set(shtml.app.variables.posts.get().filter((existing: { id: number }) => existing.id !== id));
    }
});
