(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    /**
     * Sequences the playback of a colection of clips described by the "clipSequence" option
     */
    fluid.defaults("colin.clipSequencer", {
        gradeNames: ["fluid.modelComponent", "fluid.eventedComponent", "autoInit"],
    
        model: {
            clipIdx: 0
        },
    
        invokers: {
            start: {
                funcName: "colin.clipSequencer.start",
                args: [
                    "{that}.model",
                    "{that}.options.clipSequence",
                    "{that}.clock",
                    "{that}.layer",
                    "{that}.preRoller",
                    "{that}.events.onNextClip",
                    "{that}.options.loop"
                ]
            }
        },
    
        components: {
            clock: {
                type: "flock.scheduler.async"
            },
        
            layer: {},
        
            preRoller: {
                type: "aconite.video"
            }
        },
    
        events: {
            onNextClip: null
        },
    
        loop: false,
    
        clipSequence: []
    });

    colin.clipSequencer.swapClips = function (source, preRoller, inTime) {
        var displayEl = source.element,
            preRollEl = preRoller.element;
    
        preRollEl.currentTime = inTime === undefined ? 0 : inTime;
        preRollEl.play();
        displayEl.pause();
    
        source.element = preRollEl;
        preRoller.element = displayEl;
    };

    colin.clipSequencer.displayClip = function (layer, clip, preRoller, onNextClip) {
        onNextClip.fire(clip);
        colin.clipSequencer.swapClips(layer.source, preRoller, clip.inTime);
    };

    colin.clipSequencer.preRollClip = function (preRoller, clip) {
        var url = clip.url,
            inTime = clip.inTime;
        
        if (clip.inTime) {
            url = url + "#t=" + inTime + "," + (inTime + clip.duration);
        }
    
        preRoller.setURL(url);
    };

    colin.clipSequencer.nextClip = function (model, sequence, loop) {
        var nextIdx = model.clipIdx + 1;
        
        if (nextIdx >= sequence.length) {
            if (loop) {
                nextIdx = 0;
            } else {
                return;
            }
        }
    
        return sequence[nextIdx];
    };

    // TODO: Ridiculous arg list means ridiculous dependency structure.
    colin.clipSequencer.start = function (model, sequence, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx = 0;
        layer.source.element.play();
        colin.clipSequencer.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
    };

    colin.clipSequencer.scheduleNextClip = function (model, sequence, clock, layer, preRoller, onNextClip, loop) {
        var idx = model.clipIdx >= sequence.length ? 0 : model.clipIdx,
            nextClip = colin.clipSequencer.nextClip(model, sequence, loop),
            currentClip = sequence[idx];
    
        if (!nextClip) {
            return;
        }
    
        colin.clipSequencer.preRollClip(preRoller, nextClip);
        clock.once(currentClip.duration, function () {
            colin.clipSequencer.displayClip(layer, nextClip, preRoller, onNextClip);
            model.clipIdx++;
            colin.clipSequencer.scheduleNextClip(model, sequence, clock, layer, preRoller, onNextClip, loop);
        });
    };

}());