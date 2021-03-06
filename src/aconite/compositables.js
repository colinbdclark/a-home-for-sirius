(function () {
    "use strict";
    
    fluid.registerNamespace("aconite");
    
    fluid.defaults("aconite.texture", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        members: {
            gl: null
        },
        
        events: {
            onTextureReady: null
        },
        
        listeners: {
            onCreate: {
                funcName: "aconite.texture.create",
                args: ["{that}"]
            }
        },
        
        parameters: {
            "TEXTURE_WRAP_S": "CLAMP_TO_EDGE",
            "TEXTURE_WRAP_T": "CLAMP_TO_EDGE",
            "TEXTURE_MIN_FILTER": "NEAREST",
            "TEXTURE_MAG_FILTER": "NEAREST"
        },
        
        bindToTextureUnit: "TEXTURE0"
    });
    
    aconite.texture.create = function (that) {
        // TODO: Figure out why this doesn't work as a member expander.
        var gl = that.gl,
            texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        fluid.each(that.options.parameters, function (value, key) {
            gl.texParameteri(gl.TEXTURE_2D, gl[key], gl[value]);
        });
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        that.texture = texture;
        that.events.onTextureReady.fire(texture);
        
        return texture;
    };
    
    fluid.defaults("aconite.video", {
        gradeNames: ["fluid.modelComponent", "fluid.eventedComponent", "autoInit"],
        
        model: {
            url: "{that}.options.url"
        },
        
        members: {
            element: {
                expander: {
                    funcName: "aconite.video.setupVideo",
                    args: ["{that}", "{that}.options.url"]
                }
            }
        },
        
        invokers: {
            setURL: {
                funcName: "aconite.video.updateVideoURL",
                args: ["{that}", "{arguments}.0"]
            },
            
            isReady: {
                funcName: "aconite.video.isReady",
                args: ["{that}", "{that}.element"]
            }
        },
        
        events: {
            onVideoLoaded: null,
            onReady: null,
            onVideoEnded: null
        },
        
        url: "",
        
        templates: {
            video: "<video src='%url' muted='true'/>"
        } 
    });
    
    aconite.video.renderVideo = function (that, url) {
        var videoHTML = fluid.stringTemplate(that.options.templates.video, {
            url: url
        });
        
        var video = $(videoHTML);
        
        video.bind("canplay", function () {
            that.events.onVideoLoaded.fire(video);
        });
        
        video.bind("ended", function () {
            that.events.onVideoEnded.fire(video);
        });
        
        return video[0];
    };
    
    aconite.video.setupVideo = function (that, url) {
        var video = aconite.video.renderVideo(that, url);
        
        var once = function (e) {
            that.events.onReady.fire(that);
            video.removeEventListener("canplay", once, true);
        };
        
        video.addEventListener("canplay", once, true);
        
        return video;
    };
    
    aconite.video.updateVideoURL = function (that, url) {
        that.model.url = url;
        that.element.src = url;
        return that.element;
    };
    
    aconite.video.isReady = function (that, videoEl) {
        return videoEl && videoEl.readyState === 4;
    };
    
    fluid.defaults("aconite.compositable", {
        gradeNames: ["aconite.texture", "autoInit"],
        
        components: {
            source: {}
        },
        
        invokers: {
            refresh: {
                funcName: "aconite.compositable.refresh",
                args: ["{that}.gl", "{that}.source", "{that}.texture", "{that}.options.bindToTextureUnit"]
            }
        }
    });
    
    aconite.compositable.refresh = function (gl, source, texture, textureUnit) {
        if (!source.isReady()) {
            return;
        }
        
        gl.activeTexture(gl[textureUnit]);        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.element);
    };
    
    fluid.defaults("aconite.compositableVideo", {
        gradeNames: ["aconite.compositable", "autoInit"],
        
        components: {
            source: {
                type: "aconite.video"
            }
        }
    });
}());
