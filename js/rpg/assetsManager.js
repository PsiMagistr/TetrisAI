class AssetManager{
    constructor(){
        this.imageCache = {};
        this.assets = {};
        console.log("AssetManager");

    }
    load(path){
        if(this.imageCache[path]){
            return this.imageCache[path];
        }
        const picture = new Image();
        const promise = new Promise((resolve, reject)=>{
            picture.addEventListener('load',()=>{
                resolve(picture);
            }, {once:true});
            picture.addEventListener('error',()=>{
                reject(new Error(`Failed to load picture: ${path}`));
            }, {once:true})
        })
        picture.src = path;
        this.imageCache[path] = promise;
        return promise;
    }
    async preload(config){
        const promises = []
        for(let [key, path] of Object.entries(config)){
            const loadPromise = this.load(path).then(img=>{
                this.assets[key] = img;
            })
            promises.push(loadPromise);
        }
        await Promise.all(promises);
        console.log("Все картинки загружены.")
    }
    getPictureByKey(key){
        if(this.assets[key]){
            return this.assets[key];
        }
    }
}