/**
 * Created by wrb on 2020/4/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_service_type_edit",
        defaults = {
            serverTypeList:null,
            serverType:null,//已选择的数据
            isPopover:false,
            popoverType:3,
            saveCallback: null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._busInformation = null;//选择的工商信息
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_org/m_org_service_type_edit', {
                serverTypeList:that.settings.serverTypeList
            });


            var render = function ($popover) {

                if($popover==null)
                    $popover = $(that.element);

                $popover.html(html);
                that.initICheck();
                $popover.find('button[data-action="addServerType"]').off('click').on('click',function () {

                    var iHtml = '<div class="service-type pull-left m-r-xs m-t-sm">\n' +
                        '            <label class="i-checks i-checks-label checkbox-inline fw-normal pull-left no-padding">\n' +
                        '                <input name="serverType" value="" type="checkbox" checked>\n' +
                        '                <span class="i-checks-span-default"></span>\n' +
                        '            </label>\n' +
                        '            <div class="pull-left">\n' +
                        '                <input type="text" class="form-control input-sm width-120 m-t-n-xs p-xxs" name="customServerType" onkeyup="regularExpressions.cleanSpecialChar(this)">\n' +
                        '            </div>\n' +
                        '        </div>';

                    $popover.find('#customServerTypeBox').append(iHtml);
                    that.initICheck();
                    return false;
                });
            };



            if(that.settings.isPopover){
                $(that.element).m_floating_popover({
                    type:that.settings.popoverType,
                    content:'',
                    placement:'bottom',
                    hideElement:true,//是否隐藏元素
                    //isArrow : true,
                    popoverClass:'p-xs',
                    popoverStyle:{'max-width':'750px','box-shadow':'none','border-radius':'unset'},
                    renderedCallBack:function ($popover) {
                        render($popover);

                        if(!isNullOrBlank(that.settings.serverType)){
                            var serverTypeList = that.settings.serverType.split(',');
                            $.each(serverTypeList,function (i,item) {
                                var $serverType = $popover.find('input[name="serverType"][data-name="'+item+'"]');
                                if($serverType.length>0){
                                    $serverType.iCheck('check');
                                }else{
                                    $popover.find('button[data-action="addServerType"]').click();
                                    $popover.find('input[name="customServerType"]:last').val(item);
                                }
                            })
                        }
                    },
                    closed:function ($popover) {

                        var serverTypeStr = '';
                        var i = 0;
                        $popover.find('input[name="serverType"]:checked').each(function () {
                            var $customServerType = $(this).closest('.service-type').find('input[name="customServerType"]');
                            if($customServerType.length>0){
                                serverTypeStr += $customServerType.val() + ',';
                            }else{
                                serverTypeStr += $(this).closest('.service-type').find('.i-checks-span-default').text() + ',';
                            }
                            i++;
                        });
                        if (i > 0) {
                            serverTypeStr = serverTypeStr.substring(0, serverTypeStr.length - 1);
                        }
                        if(that.settings.saveCallback && serverTypeStr!=that.settings.serverType)
                            return that.settings.saveCallback($popover,serverTypeStr);

                    }
                },true);
            }else{

                render();
            }
            getDesignTaskList
        }
        ,initICheck:function () {
            $('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
