export default Shtml.definePage(shtml => class {
    onMount() {
        shtml.app.instance.loadPosts();
        if (shtml.router.params.id) console.log(`VIEWING POST ${shtml.router.params.id}`);
    }
    addPost() {
        shtml.pages['post-editor'].showModal();
    }
    editPost(id: number) {
        shtml.router.navigate(`/posts/${id}/edit`);
    }
    editPostModal(id: number) {
        shtml.pages['post-editor'].showModal({ data: { id } });
    }
    deletePost(id: number) {
        shtml.app.instance.deletePost(id);
    }
});
