/**
 * 技术协同-编辑
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_technology_show_more",
        defaults = {
            isDialog:true,
            type:null,//1.编辑创新委员会 2.编辑成员
            tempData:'',
            cancelCallBack:null,//取消回调
            saveCallBack:null//回调函数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._filterData = {
                pageIndex : 0,
                pageSize : 10
            };
            var   title = '创新技术业务工作会会议纪要';
            if(that.settings.type==4){
                title = '获奖情况';
            }
            var html = template('m_technology_sync/m_technology_show_more', {
                title:title
            });
            $(that.element).html(html);
            that.renderContent(1)
        }
        /**
         *
         * @param t=1,第一次渲染
         * @param callBack
         */
        ,renderContent:function (t,callBack) {
            var that = this;
            var option  = {};
            option.url = restApi.url_listSkillSynergy;
            option.postData = filterParam(that._filterData);
            option.postData.type=that.settings.type;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    if(response.data.data && response.data.data.length>0){


                        var html = template('m_technology_sync/m_technology_show_more_item',{dataList:response.data.data});
                        $(that.element).find('.messageList').append(html);

                        var pageTotal = (that._filterData.pageIndex+1)*that._filterData.pageSize;
                        if(pageTotal>=response.data.total){
                            $(that.element).find('a[data-action="btnPageNext"]').hide();
                        }else{
                            $(that.element).find('a[data-action="btnPageNext"]').show();
                        }
                        that._filterData.pageIndex++;
                        that.bindActionClick();
                        that.editHoverFun();
                        that.bindTrActionClick();
                        if(that.settings.type==3){
                            that.bindTrActionClick2();
                        }
                    }
                    if(callBack)
                        callBack(response.data.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //行事件绑定
        , bindTrActionClick: function () {
            var that = this;

           var $ele = $(that.element).find('.msg-content');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xDelete"]').on('click', function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.attr('data-value');
                //获取节点数据
                switch (dataAction) {
                    case 'xDelete'://删除

                        S_layer.confirm('确定删除该条数据吗？',function(){
                            var option={};
                            option.url=restApi.url_deleteSynergyInfo;
                            option.postData = {
                                id:dataId
                            };
                            m_ajax.postJson(option,function (response) {
                                if(response.code=='0'){
                                    S_toastr.success('操作成功！');
                                    that.init();
                                }else {
                                    S_layer.error(response.info);
                                }
                            });
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;

                }
                stopPropagation(e);
                return false;

            });
        } //行事件绑定
        , bindTrActionClick2: function () {
            var that = this;

            $.each($(that.element).find('div[data-action="fileAction"]'), function (i, o) {
                $(o).off('click.fileAction').on('click.fileAction', function () {
                    window.open($(this).attr('data-src'));
                })
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction=$this.attr('data-action');

                switch (dataAction){
                    case 'btnPageNext':
                        that.renderContent(0,function (data) {
                            if(data==null || data.length==0){
                                $this.parent().html('<p class="fc-v1-grey">没有更多数据了</p>');
                            }
                        });
                        break;
                    case 'back':
                        $(that.element).m_technology_sync({

                            type: 3,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                }
                return false;

            });
        }  //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('.msg-content');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xDelete"]').each(function () {

                var $this = $(this);

                $this.closest('.msg-content').hover(function () {
                    $this.css('visibility','visible');
                },function () {
                    $this.css('visibility','hidden');
                })
            });
        }
        //保存验证
        ,save_validate: function ($ele) {
            var that = this;

            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('form').validate({
                rules: {
                    remark: {
                        required: true,
                    },
                },
                messages: {
                    remark: {
                        required: '会议纪要名称不能为空',
                    },
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    if(element.closest('.row-edit-item').length>0){
                        error.appendTo(element.closest('.row-edit-item'));
                    }else{
                        error.appendTo(element.closest('.col-sm-10'));
                    }

                }
            });
        }
        //保存签发
        ,save:function (e) {
            var options={},that=this;
            options.url=restApi.url_saveSkillSynergyInfo;
            options.postData = {};
            options.postData.content = $(that.element).find('input[name="remark"]').val();
            options.postData.type = that.settings.type ;
            options.postData.id = that.settings.id ;
            options.postData.companyId = that._currentCompanyId;
            options.postData.fileId = that._fileId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
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
