/**
 * 浮窗
 * 基于bootstrap popover样式
 * Created by wrb on 2018/9/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_floating_popover",
        defaults = {
            clearOnInit:true//是否清掉其他的浮窗
            ,content:null//内容
            ,placement:'top'
            ,width:null
            ,height:null
            ,maxWidth:null
            ,maxHeight:null
            ,isArrow: false//是否展示arrow icon
            ,quickClose:true//点击浮窗外，关闭浮窗
            ,isQuickCloseStopPropagation : true //是否关闭停止冒泡
            ,isTargetQuickClose:false//点击目标元素是否关闭浮窗
            ,popoverClass:null
            ,popoverStyle:null
            ,isTargetPositionCenter:true//目标元素是否定位中心
            ,scrollClass:null//滚动条class
            ,scrollClose:true//滚动是否关闭浮窗
            ,windowScrollClose:false//window滚动是否关闭浮窗
            ,renderedCallBack:null
            ,type:1//默认=1,2=相对，3=inline
            ,closed:null
            ,hideElement:false//目标元素是否隐藏
            ,targetNotQuickCloseArr:null//点击目标元素不关闭浮窗([class名1,class名2...])
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._scrollClass = 'm-scroll-box';//默认出现滚动条的元素
        this._scrollClassArr = [];
        this._eleId = $(this.element).attr('id')==undefined?'':$(this.element).attr('id');

        this._key = UUID.genV4().hexNoDelim;//生成key，对应选择的popover
        $(this.element).attr('data-target-uuid',this._key);//给目标元素附上标识
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {


            var that = this;

            //是否清掉其他的浮窗
            if (that.settings.clearOnInit === true)
                that.closePopover(0);

            if(that.settings.hideElement === true)
                $(that.element).hide();

            var $floatingPopover = $('<div class="popover m-floating-popover box-shadow" data-uuid="'+that._key+'" data-id="'+that._eleId+'" data-hide="'+(that.settings.hideElement === true?1:0)+'" data-placement="'+that.settings.placement+'" data-arrow="'+(that.settings.isArrow?'1':'0')+'" data-type="'+that.settings.type+'" style="display:none;"></div>');

            var $arrow = $('<div class="arrow" style="left: 50%;"></div>');
            if(that.settings.isArrow)
                $floatingPopover.append($arrow);

            var $content = $('<div class="floating-layer-content">'+that.settings.content+'</div>');

            //设置属性
            if(that.settings.width!=null)
                $content.css('width',that.settings.width);

            if(that.settings.height!=null)
                $content.css('height',that.settings.height);

            if(that.settings.maxWidth!=null)
                $content.css('max-width',that.settings.maxWidth);

            if(that.settings.maxHeight!=null)
                $content.css('max-height',that.settings.maxHeight);

            if(that.settings.popoverClass!=null)
                $floatingPopover.addClass(that.settings.popoverClass);

            if(that.settings.popoverStyle)
                $floatingPopover.css(that.settings.popoverStyle);

            $floatingPopover.append($content);

            if(that.settings.type==1){
                $(document.body).append($floatingPopover);

            }else{
                $(that.element).after($floatingPopover);
            }
            that.setPosition($(that.element),$floatingPopover,that.settings.placement,that.settings.isArrow);

            $floatingPopover.fadeToggle();

            var t = setTimeout(function () {
                that.resizeFun();
                clearTimeout(t);
            },100);

            if(that.settings.quickClose)
                that.quickClose();

            that.scrollFun(that.settings.scrollClose);
            that.windowScrollFun(that.settings.windowScrollClose);

            if(that.settings.renderedCallBack)
                that.settings.renderedCallBack($floatingPopover)

        }
        //浮窗位置定位
        ,setPosition: function ($ele,$floatingPopover,placement,isArrow,type) {
            var that = this;
            if ($floatingPopover.length > 0) {

                var p_p = placement;//浮窗的展示位置
                var p_p_new = p_p;

                var a_ptop =0;//a标签的top值
                var a_pleft = 0;//a标签的left值

                var popoverType = $floatingPopover.attr('data-type');
                var eleId = $floatingPopover.attr('data-id');
                if($ele.length==0){
                    if(!isNullOrBlank(eleId)){
                        if($('#'+eleId).length>0){
                            $ele = $('#'+eleId);
                        }
                    }
                }

                if(popoverType==1){
                    a_ptop = $ele.offset().top;
                    a_pleft = $ele.offset().left;
                }else{
                    a_ptop = $ele.position().top;
                    a_pleft = $ele.position().left;
                }

                var a_width = $ele.outerWidth();//a标签的width值
                var a_height = $ele.outerHeight();//a标签的height值

                var p_width = $floatingPopover.width();//浮窗的宽度
                var p_height = $floatingPopover.outerHeight();//浮窗的高度
                var p_top = 0;//浮窗的top值
                var p_left = 0;//浮窗的left值
                var p_p_top = '';
                var p_p_left = '50%';

                switch (p_p) {
                    case 'top':
                        p_top = (a_ptop - p_height);
                        p_left = a_pleft + a_width / 2 - p_width / 2;
                        break;
                    case 'topLeft':
                        break;
                    case 'topRight':
                        break;
                    case 'bottom':
                        p_top = (a_ptop + a_height);
                        p_left = a_pleft + a_width / 2 - p_width / 2;
                        break;
                    case 'bottomLeft':
                        p_p_new = 'bottom';
                        p_top = (a_ptop + a_height);
                        p_left = a_pleft;
                        p_p_top = '';
                        p_p_left = '10%';
                        break;
                    case 'bottomRight':
                        p_p_new = 'bottom';
                        p_top = (a_ptop + a_height);
                        p_left = a_pleft - p_width + (that.settings.isTargetPositionCenter?a_width / 2:a_width);
                        p_p_top = '';
                        p_p_left = '90%';
                        break;
                    case 'left':
                        p_top = (a_ptop - p_height / 2 + 5);
                        p_left = a_pleft - p_width - 10;
                        p_p_top = '50%';
                        p_p_left = '';
                        break;
                    case 'leftTop':
                        break;
                    case 'leftBottom':
                        break;
                    case 'right':
                        p_top = (a_ptop - p_height / 2 + 7);
                        p_left = a_pleft + a_width;
                        p_p_top = '50%';
                        p_p_left = '';
                        break;
                    case 'rightTop':
                        break;
                    case 'rightBottom':
                        break;
                };
                $floatingPopover.removeClass('top').addClass(p_p_new);
                $floatingPopover.find('.arrow').css({'top': p_p_top, 'left': p_p_left});

                if(popoverType==3){
                    $floatingPopover.css({
                        'position': 'relative',
                        'top': '0px',
                        'left': '0px'
                    });
                }else{
                    $floatingPopover.css({
                        'position': 'absolute'
                        //,'display': 'inline-block'
                        //,'top': p_top
                        //,'left': p_left
                    });
                    var time = 100;
                    if(type==1)
                        time = 0;
                    $floatingPopover.animate({left:p_left,top:p_top},time);
                }

                if(that.settings.popoverStyle)
                    $floatingPopover.css(that.settings.popoverStyle);

                if(!isArrow)
                    $floatingPopover.css('margin','0');



            }
        }
        //当鼠标点击的焦点不在浮窗内时，关闭浮窗
        ,quickClose: function () {
            var that = this;
            var mouseDownFlag = false;
            $(document).on('mousedown.m-floating-popover', function (e) {
                mouseDownFlag = $(e.target).parents('.m-floating-popover').length > 0 || $(e.target).is('.m-floating-popover');
            });
            $(document).on('click.m-floating-popover', function (e) {

                //console.log('document.clicked.m-floating-popover');
                var flag = $(e.target).parents('.m-floating-popover').length > 0 || $(e.target).is('.m-floating-popover');
                var flag1 = false;
                if(!that.settings.isTargetQuickClose)
                    flag1 = $(e.target).is($(that.element)) || $(e.target).closest(that.element).length;

                var flag2 = false;
                if(that.settings.targetNotQuickCloseArr && that.settings.targetNotQuickCloseArr.length>0){
                    $.each(that.settings.targetNotQuickCloseArr,function (i,item) {
                        flag2 = $(e.target).is($('.'+item)) || $(e.target).closest('.'+item).length;
                        if(flag2)
                            return false;
                    });
                }
                if (mouseDownFlag||flag || flag1 || flag2){
                    if(that.settings.isQuickCloseStopPropagation){
                        return false;
                    }
                }else{
                    that.closePopover();
                }
                mouseDownFlag = false;
            });
        }
        //当浏览器大小改变时，窗口位置重新改变
        ,setAllPopoverPosition:function (type) {
            var that = this;
            $('.m-floating-popover').each(function(){
                var $this = $(this);
                var dataId = $this.attr('data-uuid');
                var placement = $this.attr('data-placement');
                var arrow = $this.attr('data-arrow')=='1'?true:false;


                if(placement==undefined || placement=='')
                    return true;

                var $ele = null;
                if(dataId==undefined || dataId==''){
                    $ele = $this.prev();
                }else{
                    $ele = $('[data-target-uuid="'+dataId+'"]');
                }


                //延迟重置位置，避免左菜单缩放影响
                var time = 300;
                if(type==1)
                    time = 0;

                var t = setTimeout(function () {
                    that.setPosition($ele,$this,placement,arrow,type);
                    clearTimeout(t);
                },time)
            });
        }
        ,resizeFun : function () {
            var that = this;
            $(window).on('resize.m-floating-popover', function(e){
                //console.log('resize.m-floating-popover');
                that.setAllPopoverPosition(0);
            });
        }
        //自定义滚动事件
        ,scrollFun:function (scrollClose) {
            var that = this;
            that._scrollClassArr.push(that._scrollClass);
            if(that.settings.scrollClass){
                that._scrollClassArr.push(that.settings.scrollClass)
            }
            $.each(that._scrollClassArr,function (i,item) {

                $('.'+item).on('scroll.m-floating-popover', function(e){
                    //console.log('scroll.m-floating-popover');
                    if(scrollClose){//关闭
                        that.closePopover();
                    }else{//不关闭，重置位置
                        that.setAllPopoverPosition(1);
                    }
                })
            });

        }
        //window滚动事件
        ,windowScrollFun:function (windowScrollClose) {
            var that = this;
            $(window).on('scroll.m-floating-popover', function(e){
                //console.log('windowScroll');
                if(windowScrollClose){
                    that.closePopover();
                }else{
                    that.setAllPopoverPosition(1);
                }
            });
        }
        //关闭弹窗(t=0&其他=关闭所有,t=1=关闭当前)
        ,closePopover: function (t) {
            var that = this;
            var $currPopover = $('.m-floating-popover[data-uuid="'+that._key+'"]');

            //返回关闭回滚
            if(t!=0 && that.settings.closed){
                if(that.settings.closed($currPopover)===false)
                    return false;
            }

            if(t==1){

                $currPopover.fadeIn();
                $currPopover.remove();
                if($currPopover.attr('data-hide')==1)
                    $('[data-target-uuid="'+that._key+'"]').show();

            }else{

                $(document).find('.m-floating-popover').each(function (i, o) {
                    $(o).fadeIn();
                    $(o).remove();
                    var key = $(this).attr('data-uuid');
                    if($(this).attr('data-hide')==1)
                        $('[data-target-uuid="'+key+'"]').show();

                    $('[data-target-uuid="'+key+'"]').removeAttr('data-target-uuid');
                });
                $(document).off('click.m-floating-popover');
                $(window).off('scroll.m-floating-popover');
                $(window).off('resize.m-floating-popover');

                $.each(that._scrollClassArr,function (i,item) {
                    $('.'+item).off('scroll.m-floating-popover');
                });
            }




        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);


