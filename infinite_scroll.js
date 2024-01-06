
var _DEBUG_ = true;
function dprt() {
    if(_DEBUG_) {
        console.log.apply(null, arguments);
    }
}

var n1d = new function() {
    var self = this;
    
    self.argmin = function(x, n) {
        var idx = -1;
        var nmin = Infinity;
        for(var i = 0; i < x.length; i += 1) {
            if(x[i] < nmin) {
                nmin = x[i];
                idx = i;
            }
        }
        return idx;
    }
    
    self.argmax = function(x, n) {
        var idx = -1;
        var nmax = -Infinity;
        for(var i = 0; i < x.length; i += 1) {
            if(x[i] > nmax) {
                nmax = x[i];
                idx = i;
            }
        }
        return idx;
    }
    
    return self;
}();

function onReady(fn) {
    return Promise.resolve().then(function() {
        fn();
        return true;
    });
}

function InfiniteScroll() {
    var self = this;
    self.constDataSize = 300;
    self.constVisibleMargin = 5000;
    
    self.loadData = function(startIndex, size) {
        var me = this;
        return new Promise(function(resolve) {
            var value = [];
            var index = [];
            var endIndex = startIndex + size;
            for(var i = startIndex; i < endIndex; i += 1) {
                value.push("### " + String(i) + " ###");
                index.push(i);
            }
            resolve({
                "size": value.length,
                "value": value,
                "index": index,
            });
        });
    }
    
    self.createNewSection = function(size, value, index) {
        var me = this;
        var section = document.createElement('div');
        section.setAttribute("name", "section");
        for(var i = 0; i < size; i += 1) {
            var item = document.createElement('div');
            item.setAttribute("name", "section-item");
            item.setAttribute("item-index", String(index[i]));
            item.style.width = "100%";
            item.style.overflow = "clip";
            item.innerHTML = String(value[i]);
            section.appendChild(item);
        }
        return section;
    }
    
    self.deleteOutRangeView = function() {
        var me = this;
        var scrollY = window.scrollY;
        var innerHeight = window.innerHeight;
        var margin = me.constVisibleMargin;
        var topEdge = scrollY - margin;
        var bottomEdge = topEdge + innerHeight + margin * 2;
        var sections = document.querySelectorAll('[name="section"]');
        var sectionsTopBottom = me.setupTopsAndBottoms(sections);
        var flags = [];
        for(var i = 0; i < sectionsTopBottom.size; i += 1) {
            var top = sectionsTopBottom.top[i];
            var bottom = sectionsTopBottom.bottom[i];
            if(
                (top < topEdge && bottom < topEdge) ||
                (top > bottomEdge && bottom > bottomEdge)
                ) {
                flags.push(1);
            } else {
                flags.push(0);
            }
        }
        for(var i = 0; i < flags.length; i += 1) {
            if(flags[i] != 0) {
                sections[i].remove();
            }
        }
    }
    
    self.setupTopsAndBottoms = function(elms) {
        var me = this;
        var top = [];
        var bottom = [];
        for(var i = 0; i < elms.length; i += 1) {
            var rect = elms[i].getBoundingClientRect();
            top.push(elms[i].offsetTop);
            bottom.push(elms[i].offsetTop + elms[i].offsetHeight);
        }
        res = {
            "size": top.length,
            "top": top,
            "bottom": bottom,
        };
        return res;
    }
    
    self.onScroll = function() {
        var me = this;
        var scrollY = window.scrollY;
        var innerHeight = window.innerHeight;
        var clientHeight = document.documentElement.clientHeight;
        
        me.deleteOutRangeView();
        
        if(scrollY < 50) {
            var sections = document.querySelectorAll('[name="section"]');
            var sectionsTopBottom = me.setupTopsAndBottoms(sections);
            var sectionTopIndex = n1d.argmin(sectionsTopBottom.top);
            var sectionTop = sections[sectionTopIndex];
            var items = sectionTop.querySelectorAll('[name="section-item"]');
            var itemsTopBottom = me.setupTopsAndBottoms(items);
            var itemTopIndex = n1d.argmin(itemsTopBottom.top);
            var topItem = items[itemTopIndex];
            var index = parseInt(topItem.getAttribute("item-index"));
            me.loadData(index - me.constDataSize, me.constDataSize)
            .then(function(data) {
                var section = me.createNewSection(data.size, data.value, data.index);
                sectionTop.before(section);
                onReady(function() {
                    window.scrollTo(0, section.clientHeight + scrollY);
                });
            });
        } else if((innerHeight + scrollY) > (clientHeight - 50)) {
            var sections = document.querySelectorAll('[name="section"]');
            var sectionsTopBottom = me.setupTopsAndBottoms(sections);
            var sectionBottomIndex = n1d.argmax(sectionsTopBottom.top);
            var sectionBottom = sections[sectionBottomIndex];
            var items = sectionBottom.querySelectorAll('[name="section-item"]');
            var itemsTopBottom = me.setupTopsAndBottoms(items);
            var itemBottomIndex = n1d.argmax(itemsTopBottom.top);
            var bottomItem = items[itemBottomIndex];
            var index = parseInt(bottomItem.getAttribute("item-index"));
            dprt("index", index);
            me.loadData(index + 1, me.constDataSize)
            .then(function(data) {
                var section = me.createNewSection(data.size, data.value, data.index);
                sectionBottom.after(section);
                onReady(function() {
                    //window.scrollTo(0, 0);
                });
            });
        }
    }
    
    self.beginPage = function() {
        var me = this;
        return me.loadData(0, me.constDataSize)
        .then(function(data) {
            var section = me.createNewSection(data.size, data.value, data.index);
            var x = document.getElementById("main-contents");
            x.appendChild(section);
            return true;
        })
    }
    
    self.start = function() {
        var me = this;
        me.beginPage()
        .then(function() {
            me.onScroll();
            return true;
        }).then(function() {
            document.addEventListener("scroll", function(e) {
                me.onScroll();
            });
        })
    }
    
    return self;
}
