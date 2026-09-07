export default DRX.definePage(drx => class {
    // Set in onMount before any template/event code runs — captures whether this page was reached via
    // <x-route> (params.id) or drx.pages['post-editor'].showModal({ data: { id } }), since Cancel/Save
    // need to know whether to navigate back or close the modal.
    routedEdit = false;

    async onMount() {
        const routeId = drx.router.params.id;
        this.routedEdit = routeId != null;
        const id = routeId ?? drx.modal.data?.id;
        if (id == null) return;
        drx.page.variables.postId.set(Number(id));
        const response = await drx.apis.jsonPlaceholder.getPost.request({ parameters: { id } });
        const post = await response.value();
        drx.page.variables.title.set(post.title);
        drx.page.variables.body.set(post.body);
        drx.page.variables.userId.set(String(post.userId));
        // jsonplaceholder has no priority field — it's a client-only enrichment (see app script's loadPosts), so
        // pull it from the already-loaded local list instead, falling back to a default for a direct deep link.
        const existing = drx.app.variables.posts.get().find((existing: { id: number }) => existing.id === Number(id));
        drx.page.variables.priority.set(existing?.priority ?? 'medium');
    }
    onSubmit(event: SubmitEvent) {
        event.preventDefault();
        const postId = drx.page.variables.postId.get();
        const post = {
            title: drx.page.variables.title.get(),
            body: drx.page.variables.body.get(),
            userId: Number(drx.page.variables.userId.get()),
            priority: drx.page.variables.priority.get()
        };
        if (postId) drx.app.instance.updatePost({ id: postId, ...post });
        else drx.app.instance.createPost(post.title, post.body, post.userId, post.priority);
        this.close();
    }
    cancel() {
        this.close();
    }
    close() {
        if (this.routedEdit) drx.router.navigate('/posts');
        else drx.modal.close();
    }
});
