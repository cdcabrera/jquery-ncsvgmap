/*
* NC SVG Plugin
* Copyright 2014, CDCabrera, menotyou.com & JPstreich, jpstreich.com
* licensed under MIT license, http://opensource.org/licenses/mit-license.php
*
*/

(function(window, $, undefined){

    $.ncsvgmap = function(_settings)
    {
        _settings = $.extend(true,
        {
            displayelement: null,                           //-- multitype: DOM element, jQuery element, CSS selector string where to display the map
            svgfile:        null,                           //-- string: svg file path reference
            svgselector:    null,                           //-- string or array of strings: selector string or an array of CSS selectors used to apply events/actions
            events:         null,                           //-- object: object of events applied to the svg as a whole, use the form of {click:function(){}, mouseover:function(){}}
            hover:          null,                           //-- string: class that points to user applied style and activates a default hover state implemented by the plugin itself
            offsetlatlon:   {top:10, left:0},                //-- object: offset the pixel translation coordinates
            offsettooltips: {top:20, left:0},
            tooltipbounds:  $(window),                      //-- multitype: DOM element, jQuery element, CSS selector string for element used as the bounds for tooltips
            mapbounds:      {                               //-- most eastern, northern, western, and southern coords your map contains
                                westlon:-84.333333,
                                eastlon:-75.333333,
                                northlat:36.566667,
                                southlat:33.833333
                            },
                            
            appendgeodata:  true,                           //-- boolean: attach geopoints to parent SVG elements
            geodata:        null,                           //-- multitype: array of lat long coords in the form of [{lat:0,lon:0}], or a function that returns the aforementioned
            complete:       null,                           //-- function: callback for plugin loaded
            unsupported:    null,                           //-- multitype: DOM element, jQuery element, CSS selector string, html string or function that returns all of the aforementioned
            error:          null,                           //-- function: callback for error on "unsupported" and "complete"
            
            tooltipclasses: {
                                above:  'ncsvgmap-tooltip-above',
                                below:  'ncsvgmap-tooltip-below',
                                left:   'ncsvgmap-tooltip-left',
                                right:  'ncsvgmap-tooltip-right'
                            },
            templates:      {
                                sidedisplay:    '<div class="ncsvgmap-sidedisplay">{0}{1}</div>', //-- {0}=data-name w/ id fallback, {1}=data-desc
                                tooltip:        '<div class="ncsvgmap-tooltip">{0}{1}</div>',     //-- {0}=data-name w/ id fallback, {1}=data-desc
                                point:          '<circle cx="{0}" cy="{1}" r="5" class="ncsvgmap-datapoint"></circle>',
                                pointsparent:   '<g id="ncsvgmap-datapoints"></g>'
                            },

            mapelements:    {
                                sidedisplay:    '#side-display'
                            }
        }, _settings);

        var _data =
        {
            tooltips:   {},
            sidedisplay:{},
            addeddata:  []
        };


        Go();


        //-- start everything
        function Go()
        {
            var data = ($.isFunction(_settings.geodata))? _settings.geodata : function(){return _settings.geodata;};

            if( !_settings.displayelement || !_settings.svgfile || !_settings.svgselector )
            {
                return;
            }

            $.when(DisplaySVG(), data.call(this)).then(function()
            {
                ParseMapData.apply(this, arguments);
            }, Error);
        }


        //-- render the svg
        function DisplaySVG()
        {
            var def = new $.Deferred();

            $.simplesvg({
                parent      :   _settings.displayelement,
                file        :   _settings.svgfile,
                autoshow    :   true,
                unsupported :   _settings.unsupported,
                events      :   MapEvents(),
                complete    :   function(d)
                                {
                                    def.resolve( d );
                                },
                error       :   function(d)
                                {
                                    def.reject( d );
                                }
            });

            return def.promise();
        }


        //-- Custom MapEvents
        function MapEvents()
        {
            var eventsettings   = _settings.events,
                selector        = _settings.svgselector,
                tooltipson      = _settings.tooltipson,
                retobj          = {};

            //-- hide all tooltips and displays on resize
            $(window).on('resize', function(){
                $.each(_data.tooltips, function()
                {
                    $(this).hide();
                });

                $.each(_data.sidedisplay, function()
                {
                    $(this).hide();
                });
            });

            var events =
            {
                mouseover: function()
                {
                    try
                    {
                        simplesvg(this).above().centerOrigin();
                    }catch(e){}
                }
            };

            //-- proxy all events to pass data back
            $.each(eventsettings, function(key,value)
            {
                var tempevent = events[key];

                events[key] = function()
                {
                    var args = [].concat(Array.prototype.slice.call(arguments));
                        args.push( _data.addeddata || [] );
                        args.push( SetupToolTip.apply(this, arguments) );
                        args.push( SetupSideDisplay.apply(this, arguments) );

                    if( tempevent )
                    {
                        tempevent.apply(this, args);
                    }

                    value.apply(this, args);
                };
            });

            retobj[selector] = events;

            return retobj;
        }


        //-- parse the resulting SVG engine call and additional geodata
        function ParseMapData(svgdata, geodata)
        {
            var point           = _settings.templates.point,
                pointsparent    = _settings.templates.pointsparent,
                appendgeodata   = _settings.appendgeodata,
                svgselector     = ($.isArray(_settings.svgselector))? _settings.svgselector.join(',') : _settings.svgselector,
                svgelement      = svgdata.data.svg,
                mapwidth        = parseFloat(svgelement.getAttribute('width')),
                mapheight       = parseFloat(svgelement.getAttribute('height'));

            if($.isArray(geodata) && svgdata.supported)
            {
                pointsparent = simplesvg.makeSVG(pointsparent);
                $(svgelement).append(pointsparent);

                $.each(geodata, function(i, val)
                {
                    if(!('lat' in val) || !('lon' in val) )
                    {
                        return true;
                    }

                    var coords  = TranslateLatLon(val.lat, val.lon, mapwidth, mapheight),
                        node    = StringFormat(point, coords.left, coords.top);

                    node = simplesvg.makeSVG(node);
                    pointsparent.append(node);

                    $.each(val, function(key,value)
                    {
                        node.attr(StringFormat('data-{0}', key), value);
                    });

                    if( appendgeodata )
                    {
                        $.each(svgdata.nodes, function(index,value)
                        {
                            if( CheckInsideParent(value, node) )
                            {
                                $(value).append(node);
                            }
                        });
                    }

                    geodata[i].node = node[0];
                });

                _data.addeddata = geodata;
            }

            if( svgdata.supported )
            {
                SetupHover.apply(this, arguments);
            }

            if($.isFunction(_settings.complete))
            {
                _settings.complete.apply(this,arguments);
            }
        }


        //-- error on load fail, return unsupported content as alternative
        function Error()
        {
            var error       = _settings.error,
                unsupported = _settings.unsupported;

            if( $.isFunction(error) )
            {
                error.call(this,{unsupported : unsupported});
            }
        }


        //-- apply hover class
        function SetupHover(svgdata)
        {
            var nodes = svgdata.nodes,
                hover = _settings.hover;

            if(!hover)
            {
                return;
            }

            $.each(nodes,function()
            {
                simplesvg(this).addClass(hover);
            });
        }



        //-- setup the side display html area
        function SetupSideDisplay( event, dataobj )
        {
            var template    = _settings.templates.sidedisplay,
                mapelement  = _settings.mapelements.sidedisplay;


            var storeddata  = function(key,value)
            {
                if(key && value)
                {
                    _data.sidedisplay[key] = value;
                }
                else
                {
                    return _data.sidedisplay;
                }
            };

            var elementcss  = function()
            {
                var elementinfo = simplesvg(mapelement).getInfo();
                return {
                    position:   'absolute',
                    left:       elementinfo.currentx,
                    top:        elementinfo.currenty,
                    width:      elementinfo.currentwidth+'px',
                    height:     elementinfo.currentheight+'px'
                };
            };

            return SetupHTMLDisplays.call(this, event, dataobj, template, storeddata, elementcss);
        }


        //-- setup tooltips
        function SetupToolTip(event, dataobj)
        {
            var template    = _settings.templates.tooltip;

            var storeddata  = function(key,value)
            {
                if(key && value)
                {
                    _data.tooltips[key] = value;
                }
                else
                {
                    return _data.tooltips;
                }
            };

            var elementcss  = SetToolTipSettings;

            return SetupHTMLDisplays.call(this, event, dataobj, template, storeddata, elementcss);
        }


        //-- engine for displaying tooltips and side display
        function SetupHTMLDisplays( event, dataobj, template, storeddata, elementcss)
        {
            if(!dataobj.supported)
            {
                return [];
            }

            var jself           = $(this),
                id              = $.trim(jself.attr('id')),
                storeddisplay   = $(storeddata()[id]),
                storedparent    = dataobj.data.parent,
                name,
                desc;

            if(storeddisplay.length)
            {
                storeddisplay.css( elementcss.call(storeddisplay.get(0), this) );
                return storeddisplay.get(0);
            }

            if(!id.length)
            {
                id = RandomId();
                jself.attr('id', id);
            }

            name = $.trim(jself.attr('data-name')),
            desc = $.trim(jself.attr('data-desc'));

            template = $(StringFormat(template, name, desc));
            template.hide();

            $(storedparent).append(template);

            template.css( elementcss.call(template.get(0), this) );

            storeddata(id, template.get(0));

            return template.get(0);
        }



        //-- return tooltip css and add/remove tooltip classes
        function SetToolTipSettings( svgelement )
        {
            var jself           = $(this),
                offsettooltips  = _settings.offsettooltips,
                tooltipbounds   = _settings.tooltipbounds,
                tooltipclasses  = _settings.tooltipclasses,
                svginfo         = simplesvg(svgelement).getInfo(),
                tooltipsettings = {
                                    position:   'absolute',
                                    left:       svginfo.currentcx - (jself.outerWidth()/2),
                                    bottom:     $(window).height() - svginfo.currentcy + (svginfo.height/2)
                                  },
                checkbounds     = CheckOutsideParent.call(this, tooltipbounds, tooltipsettings);


            if( checkbounds.outside )
            {
                var jselfheight     = jself.outerHeight(),
                    jselfwidth      = jself.outerWidth();

                $.each(checkbounds, function(key,value)
                {
                    switch( key )
                    {
                        case 'above':
                            if(value > 0)
                            {
                                tooltipsettings.bottom = $(window).height() - (svginfo.currenty + svginfo.currentheight + jselfheight);
                                jself.addClass(tooltipclasses.above);

                            }
                            else
                            {
                                jself.removeClass(tooltipclasses.above);
                            }
                            break;
                        case 'below':
                            if(value > 0)
                            {
                                tooltipsettings.bottom += checkbounds.below;
                                jself.addClass(tooltipclasses.below);
                            }
                            else
                            {
                                jself.removeClass(tooltipclasses.below);
                            }
                            break;
                        case 'left':
                            if(value > 0)
                            {
                                tooltipsettings.left += checkbounds.left + 10;
                                jself.addClass(tooltipclasses.left);
                            }
                            else
                            {
                                jself.removeClass(tooltipclasses.left);
                            }
                            break;
                        case 'right':
                            if(value > 0)
                            {
                                tooltipsettings.left -= checkbounds.right + 10;
                                jself.addClass(tooltipclasses.right);
                            }
                            else
                            {
                                jself.removeClass(tooltipclasses.right);
                            }
                            break;
                    }
                });
            }
            else
            {
                jself.removeClass(StringFormat('{0} {1} {2} {3}', tooltipclasses.above, tooltipclasses.below, tooltipclasses.left, tooltipclasses.right));
            }

            if(jself.hasClass(tooltipclasses.above))
            {
                tooltipsettings.bottom -= parseFloat( offsettooltips.top );
            }
            else
            {
                tooltipsettings.bottom += parseFloat( offsettooltips.top );
            }

            if(jself.hasClass(tooltipclasses.right))
            {
                tooltipsettings.bottom -= parseFloat( offsettooltips.left );
            }
            else
            {
                tooltipsettings.bottom += parseFloat( offsettooltips.left );
            }

            return tooltipsettings;
        }


        //-- check if tooltip element is outside of its parent
        function CheckOutsideParent(tooltipparent, tooltipsettings)
        {
            var parent          = $(tooltipparent),
                parentscroll    = parent.scrollTop(),
                parentheight    = parent.height(),
                parentwidth     = parent.width(),
                parentoffset    = (parent.offset() || {left:0, top:0}),

                jself           = $(this),
                jselfheight     = jself.outerHeight(),
                jselfwidth      = jself.outerWidth(),
                jselftop        = parentheight - (tooltipsettings.bottom + jselfheight ),
                jselfleft       = tooltipsettings.left,

                above           = (jselftop <= parentscroll),
                below           = (parentheight + parentscroll <= jselftop),
                left            = (jselfleft <= parentoffset.left),
                right           = (jselfleft + jselfwidth >= parentoffset.left + parentwidth);

            return {
                outside:(below || above || left || right),
                above:  (above)? parentscroll - jselftop : 0,
                below:  (below)? jselftop - (parentheight + parentscroll) : 0,
                left:   (left)?  parentoffset.left - jselfleft : 0,
                right:  (right)? (jselfleft + jselfwidth) - (parentoffset.left + parentwidth) : 0
            };
        }



        //-- there may be an issue of this providing a false positive... the element could be on the line
        function CheckInsideParent(parentnode, childnode)
        {
            var parentinfo  = simplesvg(parentnode).getInfo(),
                childinfo   = simplesvg(childnode).getInfo()
                parentpoints= {
                                top:        parentinfo.currenty, 
                                right:      parentinfo.currentx + parentinfo.currentwidth, 
                                left:       parentinfo.currentx, 
                                bottom:     parentinfo.currenty + parentinfo.currentheight
                              },
                childpoints = {
                                top:        childinfo.currenty, 
                                right:      childinfo.currentx + childinfo.currentwidth, 
                                left:       childinfo.currentx, 
                                bottom:     childinfo.currenty + childinfo.currentheight
                              },
                isinside    = false;
            

            if( childpoints.top > parentpoints.top && 
                childpoints.bottom < parentpoints.bottom && 
                childpoints.left > parentpoints.left && 
                childpoints.right < parentpoints.right )
            {
                isinside = true;
            }

            return isinside;
        }


        //-- generate a random id for SVG nodes that lack one
        function RandomId()
        {
            return StringFormat( 'ncsvgmap{0}', Math.floor(0+Math.random()*1000000000));
        }


        //-- string formatting based on tokens
        function StringFormat()
        {
            var args    = Array.prototype.slice.call(arguments, 0),
                string  = args.shift();

            for(var i=0; i<args.length; i++)
            {
                string = string.replace( new RegExp('\\{'+i+'\\}','g'), args[i]);
            }

            return string;
        }


        //-- turn latitude longitude into pixel coords
        function TranslateLatLon(latitude, longitude, mapwidth, mapheight)
        {
            var offset      = _settings.offsetlatlon,
                mapbounds   = _settings.mapbounds,
                left        = (longitude - mapbounds.westlon) * (mapwidth / (mapbounds.eastlon - mapbounds.westlon)),
                top         = (latitude - mapbounds.northlat) * (mapheight / (mapbounds.southlat - mapbounds.northlat));

            top += offset.top;
            left += offset.left;

            return {top:top, left:left};
        }

    };

})(this, jQuery);
