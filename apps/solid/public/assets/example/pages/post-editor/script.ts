export default Shtml.definePage(shtml => class {
    // Set in onMount before any template/event code runs — captures whether this page was reached via
    // <x-route> (params.id) or shtml.pages['post-editor'].showModal({ data: { id } }), since Cancel/Save
    // need to know whether to navigate back or close the modal.
    routedEdit = false;

    async onMount() {
        const routeId = shtml.router.params.id;
        this.routedEdit = routeId != null;
        const id = routeId ?? shtml.modal.data?.id;
        if (id == null) return;
        shtml.page.variables.postId.set(Number(id));
        const response = await shtml.apis.jsonPlaceholder.getPost.request({ parameters: { id } });
        const post = await response.value();
        shtml.page.variables.title.set(post.title);
        shtml.page.variables.body.set(post.body);
        shtml.page.variables.userId.set(String(post.userId));
        // jsonplaceholder has no priority field — it's a client-only enrichment (see app script's loadPosts), so
        // pull it from the already-loaded local list instead, falling back to a default for a direct deep link.
        const existing = shtml.app.variables.posts.get().find((existing: { id: number }) => existing.id === Number(id));
        shtml.page.variables.priority.set(existing?.priority ?? 'medium');
    }
    onSubmit(event: SubmitEvent) {
        event.preventDefault();
        const postId = shtml.page.variables.postId.get();
        const post = {
            title: shtml.page.variables.title.get(),
            body: shtml.page.variables.body.get(),
            userId: Number(shtml.page.variables.userId.get()),
            priority: shtml.page.variables.priority.get()
        };
        if (postId) shtml.app.instance.updatePost({ id: postId, ...post });
        else shtml.app.instance.createPost(post.title, post.body, post.userId, post.priority);
        this.close();
    }
    cancel() {
        this.close();
    }
    close() {
        if (this.routedEdit) shtml.router.navigate('/posts');
        else shtml.modal.close();
    }
});
