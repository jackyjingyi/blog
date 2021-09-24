/**
 * 项目模板管理
 * Created by wrb on 2019/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp",
        defaults = {
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {};
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_temp', {});
            $(that.element).html(html);

            that.renderContent(1);
            that.renderContent(2);
            that.bindActionClick();
        }
        //渲染
        ,renderContent:function (type) {
            var that = this;
            that.getData(type,function (data) {
                var html = template('m_project_temp/m_project_temp_list', {dataList:data,type:type});
                $(that.element).find('.panel[data-type="'+type+'"] .panel-body').html(html);
                if(type==1){
                    that.editHoverFun();
                    that.bindTrActionClick();
                }

                rolesControl();
            });

        }
        //获取数据
        ,getData:function (type,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listProjectTemplate;
            option.postData = {type:type};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo['type_'+type] = response.data;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //编辑部门介绍
        , editDepartIntroduction: function (id) {
            var option = {}, that = this;
            option.departId= id;
            option.businessType= 1;
            option.query=that.settings.query;
            $('.ibox-content').m_editDepartIntroduction(option);
        }

        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('li');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xeditable"]').each(function () {

                var $this = $(this);

                  $this.closest('li').hover(function () {
                        $this.css('visibility','visible');
                },function () {
                        $this.css('visibility','hidden');
                })
            });
        }

        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var type = $this.closest('.panel').attr('data-type');

                switch (dataAction){
                    case 'addProjectTemp'://添加
                        $('body').m_project_temp_edit({
                            type:type,
                            pid:null,
                            dataInfo:that._dataInfo['type_'+type],
                            saveCallBack:function () {

                                that.renderContent(type);

                            }
                        });
                        break;

                }
                return false;
            });


        }
        //行事件绑定
        ,bindTrActionClick:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('li');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xeditable"]').on('click', function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.closest('li').attr('data-relation-id');
                //获取节点数据
                switch (dataAction) {
                    case 'xeditable'://添加子任务
                      that.editDepartIntroduction(dataId);
                        return false;
                        break;

                }
                stopPropagation(e);
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
                        instance = new Plugin(this, opts);getDepartDetailsInfo
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
