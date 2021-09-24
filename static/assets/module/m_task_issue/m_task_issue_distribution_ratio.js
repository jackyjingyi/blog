/**
 * 分配工作内容占比
 * Created by wrb on 2020/6/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_distribution_ratio",
        defaults = {
            isDialog:true,
            doType:1,//订单，2=任务安排
            contentTaskList:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue_distribution_ratio',{
            });
            that.renderDialog(html,function () {

                that.initSelect2();
                if(that.settings.doType==2){

                    $(that.element).find('.row.select-item').hide();
                }
            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:that.settings.title || '分配工作内容占比',
                    area : ['750px','500px'],
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {


                        var error = [];
                        var flag = true;//$(that.element).find('form').valid();

                        $(that.element).find('form').each(function (i) {
                            if(!$(this).valid()){
                                error.push(i);
                            }
                        });
                        if(error.length>0){
                            flag = false;
                        }
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        var ratioTotal = that.getTotalRatio();
                        if(ratioTotal>100){
                            S_toastr.error('占比合计超过100，请重新输入');
                            return false;
                        }

                        that.save();

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        ,initSelect2:function () {
            var that = this;
            var data = [];
            if(that.settings.contentTaskList){
                $.each(that.settings.contentTaskList,function (i,item) {
                    data.push({
                        id:item.id,
                        text:item.taskName
                    })
                })
            }

            var $select = $(that.element).find('select[name="contentTaskList"]');
            $select.select2({
                tags: false,
                allowClear: false,
                minimumResultsForSearch: -1,
                width:'100%',
                language: "zh-CN",
                placeholder: '请选择项目/子项',
                data: data
            });
            $select.on('change', function (e) {

                var taskId = $(this).val();
                var dataItem = getObjectInArray(that.settings.contentTaskList,taskId);
                var dataList = dataItem?dataItem.childList:null;
                var html = template('m_task_issue/m_task_issue_distribution_ratio_list',{
                    dataList:dataList
                });

                $(that.element).find('#ratioList').html(html);
                $(that.element).find('#ratioTotal').html(that.getTotalRatio());
                $(that.element).find('input[name="ratio"]').on('keyup',function () {
                    $(that.element).find('#ratioTotal').html(that.getTotalRatio());
                });
                that.save_validate();

            });

            if(data && data.length>0){
                $select.val(data[0].id).trigger('change');
            }

        }
        ,getTotalRatio:function () {
            var that = this;
            var ratioTotal = 0;
            $(that.element).find('input[name="ratio"]').each(function (i) {
                var ratio = $(this).val()-0;
                ratioTotal = ratioTotal+ratio;
            });
            return ratioTotal;
        }
        ,save:function (e) {
            var that=this;
            var options={};
            var taskList = [];
            $(that.element).find('form').each(function (i) {
                taskList.push({
                    id:$(this).closest('tr').attr('data-id'),
                    ratio:$(this).find('input').val()
                });

            });
            options.classId = that.element;
            options.url = restApi.url_updateTaskRatio;
            options.postData = {
                taskList:taskList
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {

                    S_layer.error(response.info);
                }
            });
        }
        ,save_validate: function ($ele) {
            var that = this;

            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('form').each(function () {
                var $this = $(this);
                $this.validate({
                    rules: {
                        ratio: {
                            required: true,
                            number:true,
                            limitProportion:true,
                            pointNumber:true
                        }
                    },
                    messages: {
                        ratio: {
                            required: '请输入占比',
                            number:'请输入有效数字',
                            limitProportion:'请输入0到100之间的数字',
                            pointNumber:'请保留小数点后两位'
                        }
                    },
                    errorElement: "label",  //用来创建错误提示信息标签
                    errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                        error.appendTo(element.closest('form'));
                    }
                });
                $.validator.addMethod('limitProportion', function(value, element) {
                    value = $.trim(value);
                    var isOk = true;
                    if( value<0 || value>100){
                        isOk = false;
                    }
                    return  isOk;
                }, '请输入0到100之间的数字!');
                $.validator.addMethod('pointNumber', function(value, element) {
                    value = $.trim(value);
                    var isOk = true;
                    if(!regularExpressions.proportionnumber.test(value)){
                        isOk = false;
                    }
                    return  isOk;
                }, '请保留小数点后两位!');
            });
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
