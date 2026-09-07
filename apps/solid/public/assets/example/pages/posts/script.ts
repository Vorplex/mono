export default DRX.definePage(drx => class {
    onMount() {
        drx.app.instance.loadPosts();
        if (drx.router.params.id) console.log(`VIEWING POST ${drx.router.params.id}`);
    }
    addPost() {
        drx.pages['post-editor'].showModal();
    }
    editPost(id: number) {
        drx.router.navigate(`/posts/${id}/edit`);
    }
    editPostModal(id: number) {
        drx.pages['post-editor'].showModal({ data: { id } });
    }
    deletePost(id: number) {
        drx.app.instance.deletePost(id);
    }
});
