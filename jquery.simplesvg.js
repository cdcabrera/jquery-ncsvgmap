/*
* SVG Plugin
* Copyright 2013, CDCabrera, menotyou.com
* licensed under MIT license, http://opensource.org/licenses/mit-license.php
*
* Utilized Keith Wood's SVG for jQuery v1.4.5 plugin as a reference for what class methods to include
* http://keith-wood.name/svg.html
* Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and
* MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
*/

(function(window, $, undefined){

    //-- SVG Plugin methods
    window.simplesvg = function()
    {
        function trimmedobj() //-- take what we need from jquery, shortcut for implmenting svg specific methods
        {
            var o = $.apply(this, arguments),
            tempobj = { selector:o.selector, length:o.length, context:o.context, each:o.each, get:o.get, eq:o.eq, splice:[].splice };
            o.each(function(i,v){ tempobj[i] = this;});
            return tempobj;
        }

        return $.extend(trimmedobj.apply(this,arguments),
        {
            addClass : function( value )
            {
                return this.each(function()
                {
                    if( !simplesvg(this).hasClass(value) )
                    {
                        this.setAttribute('class', (this.getAttribute('class')||'') + ' ' + value);
                    }
                });
            },

            removeClass : function( value )
            {
                return this.each(function()
                {
                    if( simplesvg(this).hasClass(value) )
                    {
                        this.setAttribute('class', (this.getAttribute('class')||'').replace(name, ' ').replace(/\s+/gi, '') );
                    }
                });
            },

            hasClass : function( value )
            {
                var ret = false;
                this.each(function()
                {
                    var classes = (this.getAttribute('class')||'').replace(/[\t\r\n]/g, ' ').split(/\s+/g);
                    if(classes.indexOf(value) > -1)
                    {
                        ret = true;
                        return false;
                    }
                    return true;
                });
                return ret;
            },

            above : function(isbelow)
            {
                return this.each(function()
                {
                    var parent      = $(this.parentNode),
                        parents     = parent.parentsUntil('svg'),
                        siblings    = parent.children().not(this);

                    if(isbelow)
                    {
                        parent.append( siblings );
                    }
                    else
                    {
                        parent.prepend( siblings );
                    }

                    parents.each(function()
                    {
                        var parent      = $(this.parentNode),
                            siblings    = parent.children().not(this);

                        if(isbelow)
                        {
                            parent.append( siblings );
                        }
                        else
                        {
                            parent.prepend( siblings );
                        }
                    });
                });
            },

            below : function()
            {
                return this.above(true);
            },

            centerOrigin : function( container )
            {
                var style = this.transformOrigin();

                if(style)
                {
                    style = style.split(/\s/);
                    return {
                        x: (style[0] || null),
                        y: (style[1] || null)
                    };
                }

                var coords      = this.getInfo( container ),
                    centerx     = coords.x + (coords.width / 2) + 'px',
                    centery     = coords.y + (coords.height / 2) + 'px';

                this.transformOrigin(centerx+' '+centery);

                return {x:centerx, y:centery};
            },

            transformOrigin : function( xy )
            {
                var self            = this[0],
                    vendororigin    = ['transformOrigin','webkitTransformOrigin','MozTransformOrigin','OTransformOrigin','msTransformOrigin'],
                    temparray       = vendororigin,
                    returnorigin    = null;

                if(xy)
                {
                    return this.each(function()
                    {
                        var self = this;

                        while(temparray.length)
                        {
                            var p = temparray.shift();
                            self.style[p] = xy;
                        }
                    });
                }
                else
                {
                    while(temparray.length)
                    {
                        var p = temparray.shift();

                        if(p in self.style)
                        {
                            returnorigin = self.style[p];
                            break;
                        }
                    }
                    return returnorigin;
                }
            },

            getInfo : function( container )
            {
                var self    = this[0],
                    jself   = $(this[0]),
                    bbox    = null,
                    offset  = jself.offset(),
                    rect    = self.getBoundingClientRect(),
                    obj     = {},
                    cx      = self.getAttribute('cx'),
                    cy      = self.getAttribute('cy'),
                    altpos,
                    containerpos;

                try
                {
                    obj = self.getBBox();
                }
                catch(e)
                {
                    altpos = {left: self.offsetLeft, top: self.offsetTop};
                    container = (!container)? jself.closest('svg').get(0) : simplesvg(container).get(0);

                    if(container)
                    {
                        containerpos = {left:container.offsetLeft, top:container.offsetTop};
                        obj =
                        {
                            x       : (altpos.left - containerpos.left),
                            y       : (altpos.top - containerpos.top),
                            width   : self.offsetWidth,               //-- avoided using "getBoundingClientRect" on purpose... trying to match how "getBBox" would return coords
                            height  : self.offsetHeight
                        };
                    }
                }

                $.extend(obj,{
                    cx:             ((cx && cx.length)? parseFloat(cx) : obj.x + (obj.width/2)),
                    cy:             ((cy && cy.length)? parseFloat(cy) : obj.y + (obj.height/2)),
                    node:           self,
                    currentwidth:   rect.width,
                    currentheight:  rect.height,
                    currentx:       offset.left,                        //-- use jQuery's conversion, accounts for "scroll" page height
                    currenty:       offset.top,
                    currentcx:      (offset.left + (rect.width/2)),
                    currentcy:      (offset.top + (rect.height/2))
                });

                return obj;
            },

            addSVG : function( value )
            {
                return this.each(function()
                {
                    $(this).append(simplesvg.makeSVG(value));
                });
            }
        });
    };


    //-- namespaced
    $.extend(window.simplesvg,
    {
        //-- SVG namespaced
        //-- http://stackoverflow.com/questions/9723422/is-there-some-innerhtml-replacement-in-svg-xml
        makeSVG: function( value )
        {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg">{0}</svg>';
            return $(svg.replace('{0}',value)).children();
        },

        supported: ('SVGSVGElement' in window), //-- ('createElementNS' in window.document)

        //-- allowance for use of class selectors instead of attribute selectors when using SVG
        makeSel: function( value )
        {
            return value.replace(/\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*\s*)/g,"[class*=$1]");
        }
    });



    //-- SVG engine
    $.simplesvg = function(_settings)
    {
        _settings = $.extend(true,
        {
            parent          :   null,
            file            :   null,                                           //-- string: svg file path reference
            supported       :   simplesvg.supported,                            //-- boolean: is svg supported?
            cssplacement    :   $(document).find('head > title,head > link').last(), //-- DOM element, jQuery element, CSS selector string or function returning the aforementioned: where the SVG css is inserted if it contains any - helps IE
            events          :   {},                                             //-- object: object of events applied to the svg as a whole, use the form of { 'cssselector' : {click:function(){}, mouseover:function(){}} }
            autoshow        :   true,                                           //-- boolean: plugin automatically appends and shows content, otherwise user appends content using the "complete" callback
            cache           :   false,                                          //-- boolean: cache svg/xml
            complete        :   null,                                           //-- function: callback for plugin loaded
            unsupported     :   null,                                           //-- DOM element, jQuery element, CSS selector string, html string or function that returns all of the aforementioned: displays alternate content for unsupported browsers. This creates a deep clone and detaches the original element if it exists.
            error           :   null                                            //-- function: svg data loading error
        }, _settings);


        Go();


        //-- start everything
        function Go()
        {
            var htmlobjs = $(_settings.parent);

            if( !htmlobjs.length || !_settings.file )
            {
                return;
            }

            $.when(GetSVGData()).then(function(data)
            {
                SetupContent(htmlobjs, data);
            }, Error);
        }


        //-- get svg data
        function GetSVGData()
        {
            var def     = new $.Deferred(),
                file    = _settings.file,
                cache   = _settings.cache;

            $.ajax(
            {
                url         :   file,
                dataType    :   'text', //-- bypass malformed "xml"
                cache       :   cache,
                error       :   function()
                                {
                                    def.resolve(null);
                                },
                success     :   function(data)
                                {
                                    def.resolve( $('<div/>').html(data).children() );
                                }
            });

            return def.promise();
        }


        //-- error callback
        function Error()
        {
            var error       = _settings.error,
                supported   = _settings.supported;

            if( $.isFunction(error) )
            {
                error.call(this,{data:null, supported:supported});
            }
        }


        //-- setup display content
        function SetupContent( htmlobjs, svgdata )
        {
            if( !svgdata )
            {
                Error();
                return;
            }

            var complete    = ($.isFunction(_settings.complete))? _settings.complete : function(){},
                autoshow    = _settings.autoshow,
                supported   = _settings.supported,
                unsupported = _settings.unsupported,
                tempfunc    = ($.isFunction(unsupported))? unsupported : function(){return $(unsupported);};


            htmlobjs.each(function()
            {
                var self            = this,
                    svgclone        = svgdata.clone(true),
                    nodes           = GetSVGNodes.call(svgclone.get(0)),
                    dataobj         = {
                                        parent  : self,
                                        display : null,
                                        svg     : svgclone.get(0),
                                        alt     : null
                                      };

                //-- call unsupported pass back svg information
                $.when(tempfunc.call(this, {data:dataobj, nodes:nodes, supported:supported})).then(function(data)
                {
                    var altDisplayData  = $(data).clone(true),
                        newDisplayData  = ( supported )? svgclone : altDisplayData,
                        nodes           = GetSVGNodes.call(svgclone.get(0));

                    dataobj.display = (newDisplayData.length)? newDisplayData.get(0) : null;
                    dataobj.alt     = (altDisplayData.length)? altDisplayData.get(0) : null;

                    SetEvents( dataobj.parent, dataobj );

                    if(supported)
                    {
                        SetCSS( newDisplayData );
                    }

                    if(!autoshow)
                    {
                        newDisplayData.hide();
                    }

                    $(self).html( newDisplayData );



                    complete.call(self,
                    {
                        data        : dataobj,
                        nodes       : nodes,
                        supported   : supported
                    });

                }, Error);
            });
        }


        //-- pass nodes to unsupported content
        function GetSVGNodes()
        {
            var svg     = $(this),
                events  = (_settings.events||{}),
                nodes   = [];

            if($.isEmptyObject(events))
            {
                nodes = $.makeArray(svg.find('*'));
            }
            else
            {
                $.each(events,function(key,value)
                {
                    var selector= simplesvg.makeSel(key);
                    nodes = nodes.concat( $.makeArray( svg.find(selector) ) );
                });
            }

            return  nodes;
        }


        //-- attach user defined event object
        function SetEvents( displaydata, dataobj )
        {
            var parent      = $(displaydata),
                events      = (_settings.events||{}),
                supported   = _settings.supported;

            $.each(events,function(key,value)
            {
                var selector= simplesvg.makeSel(key);

                $.each(value, function(subkey,subvalue)
                {
                    parent.on(subkey, selector, function()
                    {
                        var self        = this,
                            args        = [].concat(Array.prototype.slice.call(arguments));

                        args.push({
                            data:       dataobj,
                            selector:   selector,
                            nodes:      $.makeArray( $(dataobj.svg).find(selector) ),
                            supported:  supported,
                            element:    (supported)? simplesvg(self).getInfo() : self
                        });

                        subvalue.apply(self, args);
                    });
                });
            });
        }


        //-- reorganize css, since we do it for IE do it for everybody...
        function SetCSS( element )
        {
            var cssplacement = $.isFunction(_settings.cssplacement) ? _settings.cssplacement : function(){return $(_settings.cssplacement);},
                svgstyle     = $(element).find('style'),
                tempprevious = null;

            cssplacement = cssplacement.call(this);

            svgstyle.each(function(i,v)
            {
                var newstyle = $('<style type="text/css"/>'),
                    contents = $(this).contents();

                if(i>0)
                {
                    $(tempprevious).after(newstyle);
                }
                else
                {
                    $(cssplacement[0]).after(newstyle);
                }

                if( 'styleSheet' in newstyle[0] ) //-- ie you fantastic browser you...
                {
                    newstyle[0].styleSheet.cssText = contents.text();
                }
                else
                {
                    newstyle.html(contents);
                }

                tempprevious = newstyle;
            });
        }
    };

})(this, jQuery);
