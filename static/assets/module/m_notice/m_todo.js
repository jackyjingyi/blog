/**
 * Created by Wuwq on 2017/3/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_todo",
        defaults = {
            isFirstEnter:false//是否是第一次进来
        };

    function Plugin(element, options) {
        this.element = element;
        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_notice/m_todo', {});
            $(that.element).html(html);
            that.renderTodoList();
            that.bindActionClick();
            rolesControl();
        }

        //渲染待办任务
        ,renderTodoList:function (t) {
            var that = this;
            var option = {};
            option.param = {};
            option.param = that._filterData;

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_listMyTaskUnComing,
                params: filterParam(option.param)
            }, function (response) {

                if (response.code == '0') {
                    that._dataInfo = {childList:response.data.data};
                    var html = template('m_notice/m_todo_list',{
                        p:that._dataInfo,
                        currentCompanyId:that._currentCompanyId
                    });
                    $(that.element).find('.data-list-container').html(html);
                    if(response.data.total!=null&&response.data.total>0){
                        $('#unReadTodoCount').addClass('unReadTodoCount');
                        $('#unReadTodoCount').html(response.data.total);
                    }else{
                        $('#unReadTodoCount').removeClass('unReadTodoCount');
                        $('#unReadTodoCount').html('');
                    }
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //绑定事件
        ,bindActionClick:function () {
            var that = this;

            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this);
                var action = $this.attr('data-action');
                switch(action){

                    case 'refreshNotice'://刷新公告
                        that.init();
                        break;
                    case 'attachAllRead':
                        that.attachAllRead($this);
                        break
                }
                return false;
            });
        }
        //为点击进入公告详情绑定事件
        ,bindToNoticeDetail:function(){
            var that = this;
            $(that.element).find('div[data-action="toNoticeDetail"]').on('click',function(event){
                var id = $(this).attr('data-notice-id');//data-notice-id
                location.hash = '/announcement/detail?id='+id;
                return false;

            });
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
